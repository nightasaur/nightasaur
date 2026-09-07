import { useState, useEffect } from "react";
import { languageAPI } from "../api/client";
import { useLanguage } from "../contexts/LanguageContext";

export default function LanguageSettings() {
  const { currentLanguage, setCurrentLanguage, supportedLanguages } = useLanguage();
  const [preference, setPreference] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreference();
  }, []);

  const loadPreference = async () => {
    try {
      setLoading(true);
      const response = await languageAPI.getUserPreference();
      if (response.data?.preference) {
        setPreference(response.data.preference);
      }
    } catch (error) {
      console.error("Failed to load language preference:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    setCurrentLanguage(languageCode);
    if (preference) {
      const updated = { ...preference, primaryLang: languageCode };
      setPreference(updated);
      await savePreference(updated);
    }
  };

  const savePreference = async (updates: any) => {
    try {
      setSaving(true);
      await languageAPI.updatePreference(updates);
    } catch (error) {
      console.error("Failed to save language preference:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      await languageAPI.resetSettings();
      await loadPreference();
      setCurrentLanguage("zh-TW");
    } catch (error) {
      console.error("Failed to reset language settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="glass-card text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-red-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/70">載入語言設定...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-black mb-2">語言設定</h1>
      <p className="text-white/40 mb-8">設定您的遊戲顯示語言和相關偏好</p>

      {/* 主要語言設定 */}
      <div className="glass-card mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-1">主要語言</h2>
            <p className="text-white/50 text-sm">設定遊戲的主要顯示語言</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {supportedLanguages.find(lang => lang.code === currentLanguage)?.flag}
            </span>
            <span className="text-white/70">
              {supportedLanguages.find(lang => lang.code === currentLanguage)?.name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 ${
                currentLanguage === lang.code
                  ? "bg-red-500/20 border-2 border-red-500/50"
                  : "bg-white/5 hover:bg-white/10 border border-white/10"
              }`}
            >
              <span className="text-3xl mb-2">{lang.flag}</span>
              <span className="font-medium text-sm">{lang.name}</span>
              <span className="text-xs text-white/40 mt-1">{lang.code}</span>
              {currentLanguage === lang.code && (
                <div className="mt-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
{/* 進階設定 */}
      <div className="glass-card mb-6">
        <h2 className="text-xl font-bold mb-6">進階設定</h2>
        
        <div className="space-y-4">
          {preference && [
            {
              id: "autoDetect",
              label: "自動偵測語言",
              description: "根據瀏覽器設定自動選擇語言",
              value: preference.autoDetect
            },
            {
              id: "showRomanization",
              label: "顯示羅馬拼音",
              description: "在中文旁顯示羅馬拼音",
              value: preference.showRomanization
            },
            {
              id: "showPinyin",
              label: "顯示拼音",
              description: "在中文旁顯示拼音",
              value: preference.showPinyin
            },
            {
              id: "showEnglishHint",
              label: "顯示英文提示",
              description: "在非英文模式下顯示英文提示",
              value: preference.showEnglishHint
            }
          ].map((setting) => (
            <div key={setting.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex-1">
                <h3 className="font-medium mb-1">{setting.label}</h3>
                <p className="text-sm text-white/50">{setting.description}</p>
              </div>
              <button
                onClick={() => {
                  const updated = { ...preference, [setting.id]: !setting.value };
                  setPreference(updated);
                  savePreference(updated);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  setting.value ? "bg-red-500" : "bg-white/20"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    setting.value ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 重置按鈕 */}
      <div className="glass-card border border-red-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white mb-1">重置語言設定</h3>
            <p className="text-white/50 text-sm">將所有語言設定恢復為預設值</p>
          </div>
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "重置中..." : "重置設定"}
          </button>
        </div>
      </div>

      {/* 語言統計 */}
      <div className="mt-8 glass-card">
        <h2 className="text-xl font-bold mb-4">語言統計</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {supportedLanguages.map((lang) => (
            <div key={lang.code} className="text-center p-4 bg-white/5 rounded-xl">
              <span className="text-2xl block mb-2">{lang.flag}</span>
              <span className="font-medium text-sm block">{lang.name}</span>
              <span className="text-xs text-white/40 mt-1">使用率: --%</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-white/40 mt-4 text-center">
          語言統計數據將在更多用戶使用後顯示
        </p>
      </div>
    </div>
  );
}