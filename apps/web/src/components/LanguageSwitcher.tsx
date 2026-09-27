import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface LanguageSwitcherProps {
  compact?: boolean;
  inline?: boolean;
  onLanguageChange?: (languageCode: string) => void;
}

export default function LanguageSwitcher({ compact = false, inline = false, onLanguageChange }: LanguageSwitcherProps) {
  const { currentLanguage, setCurrentLanguage, supportedLanguages, loading } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = async (languageCode: string) => {
    await setCurrentLanguage(languageCode);
    setIsOpen(false);
    
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
    
  };

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage) || supportedLanguages[0];

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
          aria-expanded={isOpen}
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
            {!inline && <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />}
            <div className={`${inline ? "relative mt-2 w-full" : "absolute top-full mt-1 right-0 min-w-[180px]"} z-50 bg-[#0a0a1a] border border-red-500/30 rounded-xl shadow-2xl overflow-hidden`}>
              {supportedLanguages.map((lang) => (
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
        aria-expanded={isOpen}
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
            
            {supportedLanguages.map((lang) => (
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
