import { Router } from "express";
import { LanguageController } from "../controllers/language.js";
import { authMiddleware } from "../middleware/auth.ts";

const languageController = new LanguageController();
const router = Router();

// 所有路由都需要認證
router.use(authMiddleware);

// 語言設定相關
router.get("/preference", languageController.getUserLanguagePreference);
router.put("/preference", languageController.updateLanguagePreference);
router.post("/auto-detect", languageController.autoDetectLanguage);
router.get("/settings-menu", languageController.getLanguageSettingsMenu);
router.post("/reset", languageController.resetLanguageSettings);

// 語言選項列表
router.get("/languages", languageController.getSupportedLanguages);
router.get("/display-modes", languageController.getDisplayModes);
router.get("/themes", languageController.getThemes);

// 翻譯相關
router.get("/translation/:module/:key", languageController.getTranslation);
router.post("/translations/:module/batch", languageController.getBatchTranslations);
router.get("/translations/:module/:key/multi", languageController.getMultiLanguageTranslations);
router.get("/interface-translations", languageController.getGameInterfaceTranslations);
router.get("/bilingual/:module/:key", languageController.generateBilingualText);

// 歷史記錄
router.get("/history", languageController.getUserLanguageHistory);

// 管理員功能
router.get("/admin/statistics", languageController.getLanguageStatistics);
router.post("/admin/translation", languageController.upsertTranslation);

export default router;