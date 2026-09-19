import { randomBytes } from "node:crypto";
// Test-only ephemeral values; never read or write a production database.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(48).toString("base64url");
process.env.AI_ENGINE_API_KEY = randomBytes(48).toString("base64url");
process.env.DATABASE_URL = "file:/tmp/nightasaur-unit-unused.db";
process.env.SOCIAL_PUBLISH_ENABLED = "false";
