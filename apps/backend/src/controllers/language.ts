import { Request, Response } from "express";
import { languageService, SUPPORTED_LANGUAGES, DISPLAY_MODES, THEMES } from "../services/language.js";

export class LanguageController {
  // 獲取用戶語言偏好設定
  async getUserLanguagePreference(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const preference = await languageService.getUserLanguagePreference(userId);
      res.json({ preference });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 更新語言偏好設定
  async updateLanguagePreference(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const updates = req.body;
      
      const updated = await languageService.updateLanguagePreference(userId, updates);
      res.json({ 
        success: true, 
        message: "語言設定已更新",
        preference: updated 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 自動偵測語言
  async autoDetectLanguage(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const acceptLanguage = req.headers["accept-language"] as string;
      
      const result = await languageService.autoDetectLanguage(userId, acceptLanguage);
      res.json({ 
        success: true, 
        message: "語言已自動偵測",
        ...result 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取翻譯
  async getTranslation(req: Request, res: Response) {
    try {
      const { key, module } = req.params;
      const { language = "zh-TW" } = req.query;
      
      const translation = await languageService.getTranslation(key, module, language as string);
      
      if (!translation) {
        res.status(404).json({ error: "翻譯未找到" });
        return;
      }
      
      res.json({ key, module, language, translation });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 批量獲取翻譯
  async getBatchTranslations(req: Request, res: Response) {
    try {
      const { module } = req.params;
      const { keys, language = "zh-TW" } = req.body;
      
      if (!keys || !Array.isArray(keys)) {
        res.status(400).json({ error: "請提供有效的鍵值數組" });
        return;
      }
      
      const translations = await languageService.getBatchTranslations(keys, module, language);
      res.json({ module, language, translations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取多語言翻譯
  async getMultiLanguageTranslations(req: Request, res: Response) {
    try {
      const { key, module } = req.params;
      
      const translations = await languageService.getMultiLanguageTranslations(key, module);
      
      if (!translations) {
        res.status(404).json({ error: "翻譯未找到" });
        return;
      }
      
      res.json({ translations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取遊戲界面翻譯
  async getGameInterfaceTranslations(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { language = "zh-TW" } = req.query;
      
      // 獲取用戶偏好設定以決定顯示模式
      const preference = await languageService.getUserLanguagePreference(userId);
      const translations = await languageService.getGameInterfaceTranslations(language as string);
      
      res.json({ 
        translations, 
        preference, 
        language 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取支援的語言列表
  async getSupportedLanguages(req: Request, res: Response) {
    try {
      const languages = languageService.getSupportedLanguages();
      res.json({ languages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取顯示模式列表
  async getDisplayModes(req: Request, res: Response) {
    try {
      const displayModes = languageService.getDisplayModes();
      res.json({ displayModes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取主題列表
  async getThemes(req: Request, res: Response) {
    try {
      const themes = languageService.getThemes();
      res.json({ themes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取用戶語言歷史
  async getUserLanguageHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { limit = 20 } = req.query;
      
      const history = await languageService.getUserLanguageHistory(userId, parseInt(limit as string));
      res.json({ history });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 重置語言設定
  async resetLanguageSettings(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      
      const resetPreference = await languageService.resetLanguageSettings(userId);
      res.json({ 
        success: true, 
        message: "語言設定已重置為預設值",
        preference: resetPreference 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 生成雙語文本
  async generateBilingualText(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { key, module } = req.params;
      const { primaryLang, secondaryLang } = req.query;
      
      if (!primaryLang || !secondaryLang) {
        res.status(400).json({ error: "請提供主要語言和次要語言" });
        return;
      }
      
      const text = await languageService.generateBilingualText(
        key, 
        module, 
        primaryLang as string, 
        secondaryLang as string
      );
      
      res.json({ key, module, primaryLang, secondaryLang, text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 獲取語言統計（管理員用）
  async getLanguageStatistics(req: Request, res: Response) {
    try {
      // 檢查是否為管理員
      const user = req.user;
      if (!user || user.role !== "ADMIN") {
        res.status(403).json({ error: "權限不足" });
        return;
      }
      
      const statistics = await languageService.getLanguageStatistics();
      res.json({ statistics });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // 添加或更新翻譯（管理員用）
  async upsertTranslation(req: Request, res: Response) {
    try {
      // 檢查是否為管理員
      const user = req.user;
      if (!user || user.role !== "ADMIN") {
        res.status(403).json({ error: "權限不足" });
        return;
      }
      
      const translationData = req.body;
      
      // 驗證必要字段
      if (!translationData.key || !translationData.module || 
          !translationData.zhTW || !translationData.zhCN || !translationData.enUS) {
        res.status(400).json({ 
          error: "請提供 key、module、zhTW、zhCN 和 enUS 字段" 
        });
        return;
      }
      
      const translation = await languageService.upsertTranslation(translationData);
      res.json({ 
        success: true, 
        message: "翻譯已保存",
        translation 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
  // 獲取語言設定菜單
  async getLanguageSettingsMenu(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      
      // 獲取用戶當前設定
      const preference = await languageService.getUserLanguagePreference(userId);
      
      // 獲取所有可選項
      const languages = languageService.getSupportedLanguages();
      const displayModes = languageService.getDisplayModes();
      const themes = languageService.getThemes();
      
      // 生成菜單結構
      const menu = {
        language: {
          title: "語言設定",
          description: "設定遊戲顯示語言",
          options: languages.map(lang => ({
            value: lang.code,
            label: `${lang.flag} ${lang.name}`,
            nativeLabel: lang.nativeName,
            selected: preference.primaryLang === lang.code
          }))
        },
        displayMode: {
          title: "顯示模式",
          description: "設定語言顯示方式",
          options: displayModes.map(mode => ({
            value: mode.code,
            label: mode.name,
            description: mode.description,
            selected: preference.displayMode === mode.code
          }))
        },
        secondaryLanguage: {
          title: "次要語言",
          description: "設定雙語顯示時的次要語言",
          options: [
            { value: null, label: "無", description: "不使用次要語言", selected: !preference.secondaryLang },
            ...languages.map(lang => ({
              value: lang.code,
              label: `${lang.flag} ${lang.name}`,
              nativeLabel: lang.nativeName,
              selected: preference.secondaryLang === lang.code
            }))
          ]
        },
        theme: {
          title: "主題設定",
          description: "設定界面主題",
          options: themes.map(theme => ({
            value: theme.code,
            label: theme.name,
            description: theme.description,
            selected: preference.theme === theme.code
          }))
        },
        fontSize: {
          title: "字體大小",
          description: "調整文字顯示大小",
          min: 12,
          max: 24,
          step: 1,
          current: preference.fontSize,
          unit: "px"
        },
        advanced: {
          title: "進階設定",
          options: [
            {
              id: "autoDetect",
              label: "自動偵測語言",
              description: "根據瀏覽器設定自動選擇語言",
              type: "switch",
              value: preference.autoDetect
            },
            {
              id: "showRomanization",
              label: "顯示羅馬拼音",
              description: "在中文旁顯示羅馬拼音",
              type: "switch",
              value: preference.showRomanization
            },
            {
              id: "showPinyin",
              label: "顯示拼音",
              description: "在中文旁顯示拼音",
              type: "switch",
              value: preference.showPinyin
            },
            {
              id: "showEnglishHint",
              label: "顯示英文提示",
              description: "在非英文模式下顯示英文提示",
              type: "switch",
              value: preference.showEnglishHint
            }
          ]
        }
      };
      
      res.json({ 
        menu,
        currentPreference: preference,
        lastUpdated: preference.updatedAt
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}