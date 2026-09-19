// SPDX-License-Identifier: MIT

export const AUXILIARY_OPEN_SOURCE_ROLE = "AUXILIARY_OPEN_SOURCE" as const;

export const CONTENT_LICENSES = {
  "CC0-1.0": { attributionRequired: false, shareAlike: false },
  "CC-BY-4.0": { attributionRequired: true, shareAlike: false },
  "CC-BY-SA-4.0": { attributionRequired: true, shareAlike: true },
  "PDDL-1.0": { attributionRequired: false, shareAlike: false },
  "ODC-By-1.0": { attributionRequired: true, shareAlike: false },
  "ODbL-1.0": { attributionRequired: true, shareAlike: true },
} as const;

export type ContentLicense = keyof typeof CONTENT_LICENSES;

export interface OpenSourceCandidate {
  canonicalId: string;
  name: string;
  kind: string;
  sourceUrl: string;
  version?: string;
  licenseExpression?: string;
  licenseUrl?: string;
  attribution?: string;
  contentPath?: string;
  contentSha256?: string;
  contentIncluded?: boolean;
  containsPersonalData?: boolean;
  containsSensitiveData?: boolean;
  containsChildData?: boolean;
  provenance?: Record<string, unknown>;
  legalReview?: {
    status: "APPROVED";
    reviewer: string;
    reviewedAt: string;
  };
}

export interface ReviewedOpenSourceResource {
  canonicalId: string;
  name: string;
  kind: string;
  role: typeof AUXILIARY_OPEN_SOURCE_ROLE;
  sourceUrl: string;
  version: string | null;
  licenseExpression: string;
  licenseUrl: string | null;
  attribution: string | null;
  contentSha256: string | null;
  contentIncluded: boolean;
  policyReviewStatus: "APPROVED" | "REVIEW_REQUIRED" | "REJECTED";
  legalReviewStatus: "APPROVED" | "NOT_REVIEWED";
  ingestionStatus: "CONTENT_APPROVED" | "METADATA_ONLY" | "REJECTED";
  decisionReason: string;
  attributionRequired: boolean;
  shareAlikeRequired: boolean;
  commercialUseAllowed: boolean;
  redistributionAllowed: boolean;
  modificationAllowed: boolean;
  containsPersonalData: boolean;
  containsSensitiveData: boolean;
  containsChildData: boolean;
  isAuthoritative: false;
  provenanceJson: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const ID_PATTERN = /^[a-z0-9][a-z0-9._:+/@-]{2,255}$/i;

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function requireHttpsUrl(value: string): string {
  const normalized = requireText(value, "sourceUrl");
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error("sourceUrl must be a valid URL");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("sourceUrl must use HTTPS");
  }
  return parsed.toString();
}

/**
 * Review a resource for registry insertion. This deterministic policy check is
 * not legal advice or a warranty that a source is risk-free.
 */
export function reviewOpenSourceCandidate(
  candidate: OpenSourceCandidate,
): ReviewedOpenSourceResource {
  const canonicalId = requireText(candidate.canonicalId, "canonicalId");
  if (!ID_PATTERN.test(canonicalId)) {
    throw new Error("canonicalId contains unsupported characters");
  }

  const name = requireText(candidate.name, "name");
  const kind = requireText(candidate.kind, "kind").toUpperCase();
  const sourceUrl = requireHttpsUrl(candidate.sourceUrl);
  const licenseExpression = candidate.licenseExpression?.trim() || "NOASSERTION";
  const wantsContent = candidate.contentIncluded === true;
  const containsPersonalData = candidate.containsPersonalData === true;
  const containsSensitiveData = candidate.containsSensitiveData === true;
  const containsChildData = candidate.containsChildData === true;
  const contentLicense = CONTENT_LICENSES[licenseExpression as ContentLicense];
  const legalReview = candidate.legalReview;
  const reviewedAt = legalReview?.reviewedAt?.trim() || null;
  const reviewedAtTimestamp = reviewedAt ? Date.parse(reviewedAt) : Number.NaN;

  const base = {
    canonicalId,
    name,
    kind,
    role: AUXILIARY_OPEN_SOURCE_ROLE,
    sourceUrl,
    version: candidate.version?.trim() || null,
    licenseExpression,
    licenseUrl: candidate.licenseUrl?.trim() || null,
    attribution: candidate.attribution?.trim() || null,
    contentSha256: candidate.contentSha256?.trim().toLowerCase() || null,
    containsPersonalData,
    containsSensitiveData,
    containsChildData,
    isAuthoritative: false as const,
    provenanceJson: JSON.stringify(candidate.provenance ?? {}),
    reviewedBy: legalReview?.reviewer?.trim() || null,
    reviewedAt,
  };

  if (!wantsContent) {
    return {
      ...base,
      contentIncluded: false,
      policyReviewStatus: "REVIEW_REQUIRED",
      legalReviewStatus: "NOT_REVIEWED",
      ingestionStatus: "METADATA_ONLY",
      decisionReason:
        "Metadata registration only; no third-party content was copied into Nightasaur.",
      commercialUseAllowed: false,
      redistributionAllowed: false,
      modificationAllowed: false,
      attributionRequired: false,
      shareAlikeRequired: false,
    };
  }

  const rejectionReasons: string[] = [];
  if (!contentLicense) {
    rejectionReasons.push("license is not on the approved content allowlist");
  }
  if (!candidate.contentPath?.trim()) {
    rejectionReasons.push("contentPath is required");
  }
  if (!base.contentSha256 || !SHA256_PATTERN.test(base.contentSha256)) {
    rejectionReasons.push("a valid SHA-256 digest is required");
  }
  if (containsPersonalData || containsSensitiveData || containsChildData) {
    rejectionReasons.push("personal, sensitive, or child data is not accepted");
  }
  if (contentLicense?.attributionRequired && !base.attribution) {
    rejectionReasons.push("attribution is required by the declared license");
  }
  if (
    legalReview?.status !== "APPROVED" ||
    !base.reviewedBy ||
    !reviewedAt ||
    Number.isNaN(reviewedAtTimestamp)
  ) {
    rejectionReasons.push("a recorded legal review is required");
  }

  if (rejectionReasons.length > 0) {
    return {
      ...base,
      contentIncluded: false,
      policyReviewStatus: "REJECTED",
      legalReviewStatus: "NOT_REVIEWED",
      ingestionStatus: "REJECTED",
      decisionReason: rejectionReasons.join("; "),
      commercialUseAllowed: false,
      redistributionAllowed: false,
      modificationAllowed: false,
      attributionRequired: contentLicense?.attributionRequired ?? false,
      shareAlikeRequired: contentLicense?.shareAlike ?? false,
    };
  }

  return {
    ...base,
    contentIncluded: true,
    policyReviewStatus: "APPROVED",
    legalReviewStatus: "APPROVED",
    ingestionStatus: "CONTENT_APPROVED",
    decisionReason:
      "Allowlisted license and provenance checks passed; content remains auxiliary and non-authoritative.",
    commercialUseAllowed: true,
    redistributionAllowed: true,
    modificationAllowed: true,
    attributionRequired: contentLicense?.attributionRequired ?? false,
    shareAlikeRequired: contentLicense?.shareAlike ?? false,
  };
}
