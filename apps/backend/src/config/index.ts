import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3002", 10), // 改為 3002
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  database: {
    url: process.env.DATABASE_URL || "file:./dev.db",
  },

  facebook: {
    appId: process.env.FACEBOOK_APP_ID || "",
    appSecret: process.env.FACEBOOK_APP_SECRET || "",
    pageId: process.env.FACEBOOK_PAGE_ID || "",
    pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "",
    igBusinessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || "",
  },

  ai: {
    engineUrl: process.env.AI_ENGINE_URL || "http://localhost:8000",
    comfyUIUrl: process.env.COMFYUI_URL || "http://localhost:8188",
    ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
  },

  upload: {
    dir: process.env.UPLOAD_DIR || "./uploads",
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || "50", 10),
  },
};
