import { createHash } from "node:crypto";

// Fingerprints of previously published shared passwords; not secret values.
const retired = new Set([
  "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
  "5c06eb3d5a05a19f49476d694ca81a36344660e9d5b98e3d6a6630f31c2422e7",
  "d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791",
  "0ead2060b65992dca4769af601a1b3a35ef38cfad2c2c465bb160ea764157c5d",
]);

export function isRetiredPassword(password: string): boolean {
  return retired.has(createHash("sha256").update(password).digest("hex"));
}
