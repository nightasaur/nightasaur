import { Router } from "express";
import { LanguageController } from "../controllers/language.js";
import { authMiddleware } from "../middleware/auth.js";

const languageController = new LanguageController();
const router = Router();

// ?€?‰è·¯?±éƒ½?€è¦è?è­?
router.use(authMiddleware);

// èªè?è¨­å??¸é?
router.get("/preference", languageController.getUserLanguagePreference);
router.put("/preference", languageController.updateLanguagePreference);
router.post("/auto-detect", languageController.autoDetectLanguage);
router.get("/settings-menu", languageController.getLanguageSettingsMenu);
router.post("/reset", languageController.resetLanguageSettings);

// èªè??¸é??—è¡¨
router.get("/languages", languageController.getSupportedLanguages);
router.get("/display-modes", languageController.getDisplayModes);
router.get("/themes", languageController.getThemes);

// ç¿»è­¯?¸é?
router.get("/translation/:module/:key", languageController.getTranslation);
router.post("/translations/:module/batch", languageController.getBatchTranslations);
router.get("/translations/:module/:key/multi", languageController.getMultiLanguageTranslations);
router.get("/interface-translations", languageController.getGameInterfaceTranslations);
router.get("/bilingual/:module/:key", languageController.generateBilingualText);

// æ­·å²è¨˜é?
router.get("/history", languageController.getUserLanguageHistory);

// ç®¡ç??¡å???
router.get("/admin/statistics", languageController.getLanguageStatistics);
router.post("/admin/translation", languageController.upsertTranslation);

export default router;
