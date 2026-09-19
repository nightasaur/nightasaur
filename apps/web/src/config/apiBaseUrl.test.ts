import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "./apiBaseUrl";

describe("resolveApiBaseUrl", () => {
  it("uses the local backend during development", () => {
    expect(
      resolveApiBaseUrl({
        isDevelopment: true,
        developmentApiUrl: "http://localhost:4100/api/",
      }),
    ).toBe("http://localhost:4100/api");
  });

  it("uses the explicitly configured isolated backend", () => {
    expect(
      resolveApiBaseUrl({
        isDevelopment: false,
        previewApiUrl: "https://nightasaur-pr18-preview.example/api/",
      }),
    ).toBe("https://nightasaur-pr18-preview.example/api");
  });

  it("fails closed when a non-development backend is missing", () => {
    expect(() =>
      resolveApiBaseUrl({
        isDevelopment: false,
      }),
    ).toThrow("Refusing to fall back to the Production API");
  });

  it("requires an explicit opt-in for the Production same-origin proxy", () => {
    expect(
      resolveApiBaseUrl({
        isDevelopment: false,
        allowProductionProxy: true,
      }),
    ).toBe("/api");
  });
});
