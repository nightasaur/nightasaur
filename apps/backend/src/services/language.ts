import prisma from "../config/prisma.js";

// 支援的語言列表
export const SUPPORTED_LANGUAGES = {
  "zh-TW": { code: "zh-TW", name: "繁體中文", nativeName: "繁體中文", flag: "🇹🇼" },
  "zh-CN": { code: "zh-CN", name: "簡體中文", nativeName: "简体中文", flag: "🇨🇳" },
  "en-US": { code: "en-US", name: "English", nativeName: "English", flag: "🇺🇸" },
  "ja-JP": { code: "ja-JP", name: "日本語", nativeName: "日本語", flag: "🇯🇵" },
  "ko-KR": { code: "ko-KR", name: "한국어", nativeName: "한국어", flag: "🇰🇷" }
};

// 顯示模式
export const DISPLAY_MODES = {
  SINGLE: { code: "SINGLE", name: "單一語言", description: "只顯示主要語言" },
  BILINGUAL: { code: "BILINGUAL", name: "雙語顯示", description: "同時顯示兩種語言" },
  AUTO: { code: "AUTO", name: "自動切換", description: "根據上下文自動切換" }
};

// 主題
export const THEMES = {
  LIGHT: { code: "LIGHT", name: "淺色主題", description: "明亮界面" },
  DARK: { code: "DARK", name: "深色主題", description: "暗色界面" },
  AUTO: { code: "AUTO", name: "自動主題", description: "跟隨系統設定" }
};

export class LanguageService {
  // 獲取或創建用戶語言偏好設定
  async getUserLanguagePreference(userId: string) {
    const preference = await prisma.languagePreference.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        primaryLang: "zh-TW",
        displayMode: "SINGLE",
        fontSize: 16,
        theme: "LIGHT",
        autoDetect: true,
        showRomanization: false,
        showPinyin: false,
        showEnglishHint: true
      },
      include: { user: true }
    });
    
    return {
      ...preference,
      languageInfo: SUPPORTED_LANGUAGES[preference.primaryLang],
      secondaryLanguageInfo: preference.secondaryLang 
        ? SUPPORTED_LANGUAGES[preference.secondaryLang] 
        : null,
      displayModeInfo: DISPLAY_MODES[preference.displayMode],
      themeInfo: THEMES[preference.theme]
    };
  }
  
  // 更新用戶語言偏好設定
  async updateLanguagePreference(userId: string, updates: any) {
    const validUpdates = {};
    
    // 驗證並過濾更新字段
    const allowedFields = [
      "primaryLang", "secondaryLang", "displayMode", 
      "fontSize", "theme", "autoDetect",
      "showRomanization", "showPinyin", "showEnglishHint"
    ];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        validUpdates[field] = updates[field];
      }
    }
    
    // 驗證語言代碼
    if (validUpdates.primaryLang && !SUPPORTED_LANGUAGES[validUpdates.primaryLang]) {
      throw new Error(`不支援的語言代碼: ${validUpdates.primaryLang}`);
    }
    
    if (validUpdates.secondaryLang && !SUPPORTED_LANGUAGES[validUpdates.secondaryLang]) {
      throw new Error(`不支援的語言代碼: ${validUpdates.secondaryLang}`);
    }
    
    // 記錄語言變更歷史
    const oldPreference = await prisma.languagePreference.findUnique({
      where: { userId }
    });
    
    if (oldPreference && validUpdates.primaryLang && 
        oldPreference.primaryLang !== validUpdates.primaryLang) {
      await prisma.userLanguageHistory.create({
        data: {
          userId,
          fromLang: oldPreference.primaryLang,
          toLang: validUpdates.primaryLang,
          action: "CHANGE"
        }
      });
    }
    
    // 更新偏好設定
    const updated = await prisma.languagePreference.update({
      where: { userId },
      data: validUpdates,
      include: { user: true }
    });
    
    return {
      ...updated,
      languageInfo: SUPPORTED_LANGUAGES[updated.primaryLang],
      secondaryLanguageInfo: updated.secondaryLang 
        ? SUPPORTED_LANGUAGES[updated.secondaryLang] 
        : null,
      displayModeInfo: DISPLAY_MODES[updated.displayMode],
      themeInfo: THEMES[updated.theme]
    };
  }
  
  // 自動偵測語言
  async autoDetectLanguage(userId: string, acceptLanguageHeader?: string) {
    let detectedLang = "zh-TW"; // 預設繁體中文
    
    if (acceptLanguageHeader) {
      // 解析 Accept-Language 標頭
      const languages = acceptLanguageHeader.split(',');
      for (const lang of languages) {
        const [languageCode] = lang.trim().split(';');
        const normalizedCode = languageCode.toLowerCase();
        
        if (normalizedCode.startsWith('zh-tw') || normalizedCode.startsWith('zh-hant')) {
          detectedLang = "zh-TW";
          break;
        } else if (normalizedCode.startsWith('zh-cn') || normalizedCode.startsWith('zh-hans')) {
          detectedLang = "zh-CN";
          break;
        } else if (normalizedCode.startsWith('en')) {
          detectedLang = "en-US";
          break;
        } else if (normalizedCode.startsWith('ja')) {
          detectedLang = "ja-JP";
          break;
        } else if (normalizedCode.startsWith('ko')) {
          detectedLang = "ko-KR";
          break;
        }
      }
    }
    
    // 更新用戶偏好設定
    const updated = await this.updateLanguagePreference(userId, {
      primaryLang: detectedLang,
      autoDetect: true
    });
    
    // 記錄自動偵測歷史
    await prisma.userLanguageHistory.create({
      data: {
        userId,
        fromLang: "AUTO_DETECT",
        toLang: detectedLang,
        action: "AUTO_DETECT"
      }
    });
    
    return {
      detectedLang,
      preference: updatedPreference,
      message: "語言已自動偵測"
    };
  }
  
  // 獲取翻譯
  async getTranslation(key: string, module: string, language: string = "zh-TW") {
    const translation = await prisma.translation.findUnique({
      where: { key_module: { key, module } }
    });
    
    if (!translation) {
      return null;
    }
    
    // 根據語言返回對應的翻譯
    switch (language) {
      case "zh-TW":
        return translation.zhTW;
      case "zh-CN":
        return translation.zhCN;
      case "en-US":
        return translation.enUS;
      case "ja-JP":
        return translation.jaJP || translation.enUS;
      case "ko-KR":
        return translation.koKR || translation.enUS;
      default:
        return translation.enUS;
    }
  }
  
  // 獲取多語言翻譯
  async getMultiLanguageTranslations(key: string, module: string) {
    const translation = await prisma.translation.findUnique({
      where: { key_module: { key, module } }
    });
    
    if (!translation) {
      return null;
    }
    
    return {
      key,
      module,
      zhTW: translation.zhTW,
      zhCN: translation.zhCN,
      enUS: translation.enUS,
      jaJP: translation.jaJP,
      koKR: translation.koKR,
      description: translation.description,
      context: translation.context
    };
  }
  
  // 批量獲取翻譯
  async getBatchTranslations(keys: string[], module: string, language: string = "zh-TW") {
    const translations = await prisma.translation.findMany({
      where: {
        key: { in: keys },
        module
      }
    });
    
    const result = {};
    
    for (const translation of translations) {
      let text;
      switch (language) {
        case "zh-TW":
          text = translation.zhTW;
          break;
        case "zh-CN":
          text = translation.zhCN;
          break;
        case "en-US":
          text = translation.enUS;
          break;
        case "ja-JP":
          text = translation.jaJP || translation.enUS;
          break;
        case "ko-KR":
          text = translation.koKR || translation.enUS;
          break;
        default:
          text = translation.enUS;
      }
      result[translation.key] = text;
    }
    
    // 為缺失的鍵值提供預設值
    for (const key of keys) {
      if (!result[key]) {
        result[key] = key; // 使用鍵值作為預設
      }
    }
    
    return result;
  }
  
  // 添加或更新翻譯
  async upsertTranslation(data: {
    key: string;
    module: string;
    zhTW: string;
    zhCN: string;
    enUS: string;
    jaJP?: string;
    koKR?: string;
    description?: string;
    context?: string;
  }) {
    const translation = await prisma.translation.upsert({
      where: { key_module: { key: data.key, module: data.module } },
      update: data,
      create: data
    });
    
    return translation;
  }
  
  // 獲取用戶語言歷史
  async getUserLanguageHistory(userId: string, limit: number = 20) {
    const history = await prisma.userLanguageHistory.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
      include: { user: true }
    });
    
    return history.map(record => ({
      ...record,
      fromLangInfo: SUPPORTED_LANGUAGES[record.fromLang] || { code: record.fromLang, name: record.fromLang },
      toLangInfo: SUPPORTED_LANGUAGES[record.toLang] || { code: record.toLang, name: record.toLang }
    }));
  }
  
  // 獲取支援的語言列表
  getSupportedLanguages() {
    return Object.values(SUPPORTED_LANGUAGES);
  }
  
  // 獲取顯示模式列表
  getDisplayModes() {
    return Object.values(DISPLAY_MODES);
  }
  
  // 獲取主題列表
  getThemes() {
    return Object.values(THEMES);
  }
  
  // 生成雙語顯示文本
  async generateBilingualText(
    key: string, 
    module: string, 
    primaryLang: string, 
    secondaryLang: string
  ) {
    const primaryText = await this.getTranslation(key, module, primaryLang);
    const secondaryText = await this.getTranslation(key, module, secondaryLang);
    
    if (!primaryText || !secondaryText) {
      return primaryText || secondaryText || key;
    }
    
    // 根據語言組合決定顯示方式
    if (primaryLang === "zh-TW" || primaryLang === "zh-CN") {
      // 中文為主，英文/日文/韓文為輔
      return `${primaryText} (${secondaryText})`;
    } else if (secondaryLang === "zh-TW" || secondaryLang === "zh-CN") {
      // 英文/日文/韓文為主，中文為輔
      return `${primaryText} (${secondaryText})`;
    }
    
    // 其他語言組合
    return `${primaryText}`;
  }
  
  // 獲取完整的遊戲界面翻譯
  async getGameInterfaceTranslations(language: string = "zh-TW") {
    const modules = [
      "common", "menu", "settings", "game", "puzzle", 
      "squad", "dialogue", "items", "achievements"
    ];
    
    const allTranslations = {};
    
    for (const module of modules) {
      const translations = await prisma.translation.findMany({
        where: { module },
        select: { key: true }
      });
      
      const keys = translations.map(t => t.key);
      const moduleTranslations = await this.getBatchTranslations(keys, module, language);
      
      allTranslations[module] = moduleTranslations;
    }
    
    return allTranslations;
  }
  
  // 重置用戶語言設定
  async resetLanguageSettings(userId: string) {
    const resetPreference = await prisma.languagePreference.update({
      where: { userId },
      data: {
        primaryLang: "zh-TW",
        secondaryLang: null,
        displayMode: "SINGLE",
        fontSize: 16,
        theme: "LIGHT",
        autoDetect: true,
        showRomanization: false,
        showPinyin: false,
        showEnglishHint: true
      }
    });
    
    // 記錄重置歷史
    await prisma.userLanguageHistory.create({
      data: {
        userId,
        fromLang: "RESET",
        toLang: "zh-TW",
        action: "RESET"
      }
    });
    
    return resetPreference;
  }
  
  // 獲取語言統計
  async getLanguageStatistics() {
    const stats = await prisma.languagePreference.groupBy({
      by: ["primaryLang"],
      _count: { _all: true }
    });
    
    const result = {};
    let total = 0;
    
    for (const stat of stats) {
      result[stat.primaryLang] = {
        count: stat._count._all,
        percentage: 0,
        languageInfo: SUPPORTED_LANGUAGES[stat.primaryLang]
      };
      total += stat._count._all;
    }
    
    // 計算百分比
    for (const lang in result) {
      result[lang].percentage = total > 0 ? (result[lang].count / total * 100).toFixed(1) : "0.0";
    }
    
    return {
      totalUsers: total,
      statistics: result
    };
  }
}

export const languageService = new LanguageService();