import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL?.trim() || "";

if (process.env.NODE_ENV !== "preview") {
  console.error("Preview database preparation requires NODE_ENV=preview.");
  process.exit(1);
}

if (!databaseUrl.startsWith("file:")) {
  console.error(
    "Preview database preparation requires an isolated SQLite DATABASE_URL (file:...).",
  );
  process.exit(1);
}

const prisma = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(
  prisma,
  ["prisma", "db", "push", "--skip-generate", "--schema", "prisma/schema.prisma"],
  { stdio: "inherit", env: process.env },
);

process.exit(result.status ?? 1);
