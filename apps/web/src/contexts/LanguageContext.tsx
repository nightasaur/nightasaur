import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { languageAPI } from "../api/client";

interface LanguageContextType {
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
  loading: boolean;
  supportedLanguages: Array<{
    code: string;
    name: string;
    nativeName: string;
    flag: string;
  }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SUPPORTED_LANGUAGES = [
  { code: "zh-TW", name: "繁體中文", nativeName: "繁體中文", flag: "🇹🇼" },
  { code: "zh-CN", name: "簡體中文", nativeName: "简体中文", flag: "🇨🇳" },
  { code: "en-US", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "ja-JP", name: "日本語", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko-KR", name: "한국어", nativeName: "한국어", flag: "🇰🇷" }
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<string>("zh-TW");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem("nightasaur_language");
    if (savedLang && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLang)) {
      setCurrentLanguageState(savedLang);
    }
    
    // 如果用戶已登入，嘗試從服務器獲取語言偏好
    const token = localStorage.getItem("nightasaur_token");
    if (token) {
      loadUserPreference();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserPreference = async () => {
    try {
      setLoading(true);
      const response = await languageAPI.getUserPreference();
      if (response.data?.preference?.primaryLang) {
        setCurrentLanguageState(response.data.preference.primaryLang);
        localStorage.setItem("nightasaur_language", response.data.preference.primaryLang);
      }
    } catch (error) {
      console.error("Failed to load language preference:", error);
    } finally {
      setLoading(false);
    }
  };

  const setCurrentLanguage = async (languageCode: string) => {
    setCurrentLanguageState(languageCode);
    localStorage.setItem("nightasaur_language", languageCode);
    
    // 如果用戶已登入，保存到服務器
    const token = localStorage.getItem("nightasaur_token");
    if (token) {
      try {
        await languageAPI.updatePreference({ primaryLang: languageCode });
      } catch (error) {
        console.error("Failed to update language preference:", error);
      }
    }
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setCurrentLanguage,
      loading,
      supportedLanguages: SUPPORTED_LANGUAGES
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}