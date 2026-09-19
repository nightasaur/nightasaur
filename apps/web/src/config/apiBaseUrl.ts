export interface ApiBaseUrlOptions {
  isDevelopment: boolean;
  developmentApiUrl?: string;
  previewApiUrl?: string;
  allowProductionProxy?: boolean;
}

const normalizeApiUrl = (url: string) => url.replace(/\/+$/, "");

export const resolveApiBaseUrl = ({
  isDevelopment,
  developmentApiUrl,
  previewApiUrl,
  allowProductionProxy,
}: ApiBaseUrlOptions): string => {
  if (isDevelopment) {
    return normalizeApiUrl(developmentApiUrl?.trim() || "http://localhost:3002/api");
  }

  const configuredPreviewApiUrl = previewApiUrl?.trim();
  if (configuredPreviewApiUrl) {
    return normalizeApiUrl(configuredPreviewApiUrl);
  }

  if (allowProductionProxy) {
    return "/api";
  }

  throw new Error(
    "VITE_PREVIEW_API_URL is required for non-development builds unless " +
      "VITE_ALLOW_PRODUCTION_API_PROXY=true is explicitly approved. " +
      "Refusing to fall back to the Production API.",
  );
};
