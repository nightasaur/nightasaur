import { useState, useEffect } from "react";
import { languageAPI } from "../api/client";

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "zh-TW", name: "繁體中文", nativeName: "繁體中文", flag: "🇹🇼" },
  { code: "zh-CN", name: "簡體中文", nativeName: "简体中文", flag: "🇨🇳" },
  { code: "en-US", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "ja-JP", name: "日本語", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko-KR", name: "한국어", nativeName: "한국어", flag: "🇰🇷" }
];

interface LanguageSwitcherProps {
  compact?: boolean;
  onLanguageChange?: (languageCode: string) => void;
}

export default function LanguageSwitcher({ compact = false, onLanguageChange }: LanguageSwitcherProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>("zh-TW");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 從localStorage讀取保存的語言設置
  useEffect(() => {
    const savedLang = localStorage.getItem("nightasaur_language");
    if (savedLang && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLang)) {
      setCurrentLanguage(savedLang);
    }
    
    // 如果用戶已登入，嘗試從服務器獲取語言偏好
    const token = localStorage.getItem("nightasaur_token");
    if (token) {
      loadUserPreference();
    }
  }, []);

  const loadUserPreference = async () => {
    try {
      setLoading(true);
      const response = await languageAPI.getUserPreference();
      if (response.data?.preference?.primaryLang) {
        setCurrentLanguage(response.data.preference.primaryLang);
        localStorage.setItem("nightasaur_language", response.data.preference.primaryLang);
      }
    } catch (error) {
      console.error("Failed to load language preference:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    setCurrentLanguage(languageCode);
    localStorage.setItem("nightasaur_language", languageCode);
    setIsOpen(false);
    
    // 如果用戶已登入，保存到服務器
    const token = localStorage.getItem("nightasaur_token");
    if (token) {
      try {
        await languageAPI.updatePreference({ primaryLang: languageCode });
      } catch (error) {
        console.error("Failed to update language preference:", error);
      }
    }
    
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
    
    // 重新載入頁面以應用語言更改
    window.location.reload();
  };

  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30`}>
        <div className="animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"></div>
        <span className="text-sm text-white/70">載入中...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-white text-sm font-medium transition-all duration-200"
        >
          <span className="text-base">{currentLang.flag}</span>
          <span>{currentLang.code}</span>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full mt-1 right-0 z-50 min-w-[180px] bg-[#0a0a1a] border border-red-500/30 rounded-xl shadow-2xl overflow-hidden">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/10 transition-colors ${
                    currentLanguage === lang.code 
                      ? "bg-red-500/20 text-white" 
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-xs text-white/50">{lang.nativeName}</div>
                  </div>
                  {currentLanguage === lang.code && (
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }
// 完整版本
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 text-white font-medium transition-all duration-200 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentLang.flag}</span>
          <div className="text-left">
            <div className="font-bold">{currentLang.name}</div>
            <div className="text-xs text-white/60">{currentLang.nativeName}</div>
          </div>
        </div>
        <svg 
          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-50 min-w-[220px] bg-[#0a0a1a] border border-red-500/30 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-red-500/20">
              <h3 className="font-bold text-white">選擇語言</h3>
              <p className="text-xs text-white/50 mt-1">Select Language</p>
            </div>
            
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/10 transition-colors ${
                  currentLanguage === lang.code 
                    ? "bg-red-500/20 text-white" 
                    : "text-white/80 hover:text-white"
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="flex-1">
                  <div className="font-medium">{lang.name}</div>
                  <div className="text-xs text-white/50">{lang.nativeName}</div>
                </div>
                {currentLanguage === lang.code && (
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
            
            <div className="px-4 py-3 border-t border-red-500/20 bg-black/20">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>語言系統</span>
                <span className="text-red-400">Beta</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}