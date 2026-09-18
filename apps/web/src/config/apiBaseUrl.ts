export interface ApiBaseUrlOptions {
  isDevelopment: boolean;
  deploymentEnvironment?: string;
  developmentApiUrl?: string;
  previewApiUrl?: string;
}

const normalizeApiUrl = (url: string) => url.replace(/\/+$/, "");

export const resolveApiBaseUrl = ({
  isDevelopment,
  deploymentEnvironment,
  developmentApiUrl,
  previewApiUrl,
}: ApiBaseUrlOptions): string => {
  if (isDevelopment) {
    return normalizeApiUrl(developmentApiUrl?.trim() || "http://localhost:3002/api");
  }

  if (deploymentEnvironment === "preview") {
    const configuredPreviewApiUrl = previewApiUrl?.trim();

    if (!configuredPreviewApiUrl) {
      throw new Error(
        "VITE_PREVIEW_API_URL is required for Vercel Preview deployments. " +
          "Refusing to fall back to the Production API.",
      );
    }

    return normalizeApiUrl(configuredPreviewApiUrl);
  }

  return "/api";
};
