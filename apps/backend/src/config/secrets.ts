// SPDX-License-Identifier: MIT
export function requireSecret(name: string, value: string | undefined): string {
  if (!value || value.trim() !== value || Buffer.byteLength(value, "utf8") < 32 ||
      new Set(value).size < 10 || /change[-_ ]?me|dev-secret|nightasaur-secret|example|placeholder/i.test(value)) {
    throw new Error(`${name} must be an independently generated secret of at least 32 bytes`);
  }
  return value;
}
