// SPDX-License-Identifier: MIT

import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import {
  AUXILIARY_OPEN_SOURCE_ROLE,
  type OpenSourceCandidate,
  reviewOpenSourceCandidate,
} from "../src/openSource/catalog.js";

const prisma = new PrismaClient();
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../../..");
const approvedContentRoot = path.resolve(
  repositoryRoot,
  "data/open-source/approved",
);
const maximumContentBytes = 1024 * 1024;
const chunkCharacters = 8_000;

interface PackageLockEntry {
  version?: string;
  resolved?: string;
  integrity?: string;
  license?: string;
}

interface PackageLock {
  lockfileVersion?: number;
  packages?: Record<string, PackageLockEntry>;
}

interface CatalogManifest {
  schemaVersion: number;
  resources: OpenSourceCandidate[];
}

interface PreparedResource {
  candidate: OpenSourceCandidate;
  reviewed: ReturnType<typeof reviewOpenSourceCandidate>;
  chunks: Array<{ sequence: number; content: string; contentSha256: string }>;
}

function assertLocalImportTarget(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Open-source catalog import is disabled in production");
  }
  if (process.env.OPEN_SOURCE_CATALOG_IMPORT !== "I_UNDERSTAND_LOCAL_ONLY") {
    throw new Error(
      "Set OPEN_SOURCE_CATALOG_IMPORT=I_UNDERSTAND_LOCAL_ONLY for an explicit local/test import",
    );
  }
  if (!process.env.DATABASE_URL?.startsWith("file:")) {
    throw new Error("Catalog import currently accepts only a local SQLite file: database");
  }
}

function npmPackageName(packagePath: string): string | null {
  const marker = "node_modules/";
  const markerIndex = packagePath.lastIndexOf(marker);
  if (markerIndex < 0) return null;
  const name = packagePath.slice(markerIndex + marker.length);
  return name || null;
}

function npmCandidates(lock: PackageLock): OpenSourceCandidate[] {
  const candidates: OpenSourceCandidate[] = [];
  for (const [packagePath, entry] of Object.entries(lock.packages ?? {})) {
    const name = npmPackageName(packagePath);
    if (!name || !entry.version) continue;

    const fallbackUrl = `https://www.npmjs.com/package/${encodeURIComponent(name)}/v/${encodeURIComponent(entry.version)}`;
    const sourceUrl = entry.resolved?.startsWith("https://")
      ? entry.resolved
      : fallbackUrl;

    candidates.push({
      canonicalId: `pkg:npm/${name}@${entry.version}`,
      name,
      kind: "SOFTWARE_PACKAGE",
      sourceUrl,
      version: entry.version,
      licenseExpression: entry.license || "NOASSERTION",
      contentIncluded: false,
      provenance: {
        ecosystem: "npm",
        lockfileVersion: lock.lockfileVersion ?? null,
        packagePath,
        integrity: entry.integrity ?? null,
      },
    });
  }
  return candidates;
}

function pythonCandidates(requirements: string, requirementsFile: string): OpenSourceCandidate[] {
  const candidates: OpenSourceCandidate[] = [];
  for (const untrimmed of requirements.split(/\r?\n/)) {
    const line = untrimmed.trim();
    if (!line || line.startsWith("#") || line.startsWith("-r ")) continue;

    const match = line.match(/^([A-Za-z0-9._-]+)(?:\[[^\]]+\])?==([^\s;]+)$/);
    if (!match) {
      throw new Error(`Requirement must be pinned with == in ${requirementsFile}: ${line}`);
    }
    const [, rawName, version] = match;
    const normalizedName = rawName.toLowerCase().replaceAll("_", "-");
    candidates.push({
      canonicalId: `pkg:pypi/${normalizedName}@${version}`,
      name: normalizedName,
      kind: "SOFTWARE_PACKAGE",
      sourceUrl: `https://pypi.org/project/${encodeURIComponent(normalizedName)}/${encodeURIComponent(version)}/`,
      version,
      licenseExpression: "NOASSERTION",
      contentIncluded: false,
      provenance: {
        ecosystem: "pypi",
        requirementsFile,
        requirement: line,
      },
    });
  }
  return candidates;
}

function deduplicate(candidates: OpenSourceCandidate[]): OpenSourceCandidate[] {
  const resources = new Map<string, OpenSourceCandidate>();
  for (const candidate of candidates) {
    if (!resources.has(candidate.canonicalId)) {
      resources.set(candidate.canonicalId, candidate);
    }
  }
  return [...resources.values()].sort((left, right) =>
    left.canonicalId.localeCompare(right.canonicalId),
  );
}

function sha256(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

async function contentChunks(
  candidate: OpenSourceCandidate,
): Promise<PreparedResource["chunks"]> {
  if (!candidate.contentIncluded || !candidate.contentPath) return [];

  const resolvedPath = path.resolve(repositoryRoot, candidate.contentPath);
  const approvedPrefix = `${approvedContentRoot}${path.sep}`;
  if (!resolvedPath.startsWith(approvedPrefix)) {
    throw new Error(
      `${candidate.canonicalId}: contentPath must be inside data/open-source/approved`,
    );
  }

  const extension = path.extname(resolvedPath).toLowerCase();
  if (![".csv", ".json", ".md", ".tsv", ".txt"].includes(extension)) {
    throw new Error(`${candidate.canonicalId}: unsupported content file type`);
  }

  const fileInfo = await lstat(resolvedPath);
  if (!fileInfo.isFile() || fileInfo.isSymbolicLink()) {
    throw new Error(`${candidate.canonicalId}: content must be a regular file`);
  }
  if (fileInfo.size > maximumContentBytes) {
    throw new Error(`${candidate.canonicalId}: content exceeds the 1 MiB baseline limit`);
  }

  const bytes = await readFile(resolvedPath);
  if (bytes.includes(0)) {
    throw new Error(`${candidate.canonicalId}: binary content is not accepted`);
  }
  const digest = sha256(bytes);
  if (digest !== candidate.contentSha256?.toLowerCase()) {
    throw new Error(`${candidate.canonicalId}: content SHA-256 does not match the manifest`);
  }

  const content = bytes.toString("utf8");
  const chunks: PreparedResource["chunks"] = [];
  for (let offset = 0, sequence = 0; offset < content.length; offset += chunkCharacters) {
    const chunk = content.slice(offset, offset + chunkCharacters);
    chunks.push({ sequence, content: chunk, contentSha256: sha256(chunk) });
    sequence += 1;
  }
  return chunks;
}

async function loadCandidates(): Promise<OpenSourceCandidate[]> {
  const packageLockPath = path.join(repositoryRoot, "package-lock.json");
  const requirementsPath = path.join(
    repositoryRoot,
    "apps/ai-engine/requirements.txt",
  );
  const developmentRequirementsPath = path.join(
    repositoryRoot,
    "apps/ai-engine/requirements-dev.txt",
  );
  const manifestPath = path.join(
    repositoryRoot,
    "data/open-source/catalog.json",
  );

  const [lockText, requirements, developmentRequirements, manifestText] =
    await Promise.all([
      readFile(packageLockPath, "utf8"),
      readFile(requirementsPath, "utf8"),
      readFile(developmentRequirementsPath, "utf8"),
      readFile(manifestPath, "utf8"),
    ]);

  const lock = JSON.parse(lockText) as PackageLock;
  const manifest = JSON.parse(manifestText) as CatalogManifest;
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.resources)) {
    throw new Error("Unsupported open-source catalog manifest");
  }

  return deduplicate([
    ...npmCandidates(lock),
    ...pythonCandidates(requirements, "apps/ai-engine/requirements.txt"),
    ...pythonCandidates(
      developmentRequirements,
      "apps/ai-engine/requirements-dev.txt",
    ),
    ...manifest.resources,
  ]);
}

async function prepareResources(
  candidates: OpenSourceCandidate[],
): Promise<PreparedResource[]> {
  return Promise.all(
    candidates.map(async (candidate) => {
      const reviewed = reviewOpenSourceCandidate(candidate);
      const chunks =
        reviewed.ingestionStatus === "CONTENT_APPROVED"
          ? await contentChunks(candidate)
          : [];
      return { candidate, reviewed, chunks };
    }),
  );
}

async function persistResource(resource: PreparedResource): Promise<void> {
  const data = {
    ...resource.reviewed,
    reviewedAt: resource.reviewed.reviewedAt
      ? new Date(resource.reviewed.reviewedAt)
      : null,
  };
  const saved = await prisma.openSourceResource.upsert({
    where: { canonicalId: resource.reviewed.canonicalId },
    create: data,
    update: data,
  });

  await prisma.$transaction([
    prisma.openSourceContentChunk.deleteMany({ where: { resourceId: saved.id } }),
    ...(resource.chunks.length > 0
      ? [
          prisma.openSourceContentChunk.createMany({
            data: resource.chunks.map((chunk) => ({
              resourceId: saved.id,
              sequence: chunk.sequence,
              role: AUXILIARY_OPEN_SOURCE_ROLE,
              content: chunk.content,
              contentSha256: chunk.contentSha256,
              isAuthoritative: false,
            })),
          }),
        ]
      : []),
  ]);
}

async function main(): Promise<void> {
  assertLocalImportTarget();
  const candidates = await loadCandidates();
  const resources = await prepareResources(candidates);

  for (const resource of resources) {
    await persistResource(resource);
  }

  const metadataOnly = resources.filter(
    ({ reviewed }) => reviewed.ingestionStatus === "METADATA_ONLY",
  ).length;
  const contentApproved = resources.filter(
    ({ reviewed }) => reviewed.ingestionStatus === "CONTENT_APPROVED",
  ).length;
  const rejected = resources.filter(
    ({ reviewed }) => reviewed.ingestionStatus === "REJECTED",
  ).length;

  console.log(
    JSON.stringify({ total: resources.length, metadataOnly, contentApproved, rejected }),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Catalog import failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
