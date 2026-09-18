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

  it("uses the isolated backend in a Vercel Preview", () => {
    expect(
      resolveApiBaseUrl({
        isDevelopment: false,
        deploymentEnvironment: "preview",
        previewApiUrl: "https://nightasaur-pr18-preview.example/api/",
      }),
    ).toBe("https://nightasaur-pr18-preview.example/api");
  });

  it("fails closed when a Preview backend is missing", () => {
    expect(() =>
      resolveApiBaseUrl({
        isDevelopment: false,
        deploymentEnvironment: "preview",
      }),
    ).toThrow("Refusing to fall back to the Production API");
  });

  it("keeps Production on the same-origin API proxy", () => {
    expect(
      resolveApiBaseUrl({
        isDevelopment: false,
        deploymentEnvironment: "production",
        previewApiUrl: "https://must-not-be-used.example/api",
      }),
    ).toBe("/api");
  });
});
