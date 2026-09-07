import { Request, Response } from "express";
import { languageService } from "../services/language.js";

export class LanguageController {
  // 設置菜單選項
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

export const languageController = new LanguageController();