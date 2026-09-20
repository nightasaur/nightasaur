import { Router } from "express";
import { LanguageController } from "../controllers/language.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

const languageController = new LanguageController();
const router = Router();

// All language routes require authentication.
router.use(authMiddleware);

// Language preferences
router.get("/preference", languageController.getUserLanguagePreference);
router.put("/preference", languageController.updateLanguagePreference);
// The web client has historically used PATCH for partial preference updates.
// Keep PUT for backwards compatibility and accept PATCH on the same handler.
router.patch("/preference", languageController.updateLanguagePreference);
router.post("/auto-detect", languageController.autoDetectLanguage);
router.get("/settings-menu", languageController.getLanguageSettingsMenu);
router.post("/reset", languageController.resetLanguageSettings);

// Supported options
router.get("/languages", languageController.getSupportedLanguages);
router.get("/display-modes", languageController.getDisplayModes);
router.get("/themes", languageController.getThemes);

// Translations
router.get("/translation/:module/:key", languageController.getTranslation);
router.post("/translations/:module/batch", languageController.getBatchTranslations);
router.get("/translations/:module/:key/multi", languageController.getMultiLanguageTranslations);
router.get("/interface-translations", languageController.getGameInterfaceTranslations);
router.get("/bilingual/:module/:key", languageController.generateBilingualText);

// History
router.get("/history", languageController.getUserLanguageHistory);

// Administrative operations
router.get("/admin/statistics", adminMiddleware, languageController.getLanguageStatistics);
router.post("/admin/translation", adminMiddleware, languageController.upsertTranslation);

export default router;
