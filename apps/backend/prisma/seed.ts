import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { requireSecret } from "../src/config/secrets.js";

async function main() {
  if (!["test", "development"].includes(process.env.NODE_ENV || "") ||
      process.env.ALLOW_ISOLATED_SEED !== "true" ||
      !process.env.DATABASE_URL?.startsWith("file:")) {
    throw new Error("Seed requires explicit test/development mode and isolated SQLite database");
  }
  const email = process.env.SEED_ADMIN_EMAIL;
  const username = process.env.SEED_ADMIN_USERNAME;
  const password = requireSecret("SEED_ADMIN_PASSWORD", process.env.SEED_ADMIN_PASSWORD);
  if (!email || !username) throw new Error("Explicit seed identity is required");
  const prisma = new PrismaClient();
  try {
    // Never overwrite or elevate an existing account.
    await prisma.user.create({ data: {
      email, username, passwordHash: await bcrypt.hash(password, 12), role: "ADMIN",
    } });
    console.log("Isolated account created; credentials are not logged");
  } finally { await prisma.$disconnect(); }
}
main().catch(() => { console.error("Seed refused or failed"); process.exitCode = 1; });
