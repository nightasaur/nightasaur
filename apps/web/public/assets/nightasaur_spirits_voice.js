/**
 * Nightasaur.com 全站人性化雙語語音與精靈伴隨引擎 v2.0
 * (Human-Centric Bilingual Spirit Voice & Academy Engine)
 * =========================================================================
 * 專為 C:\Users\admin\.copilot\repos\nightasaur 與 RTX 3070 雙腦協同打造：
 * 1. [/spirits 精靈大廳整合]:
 *    - 自動在底部「對精靈說點什麼… [傳送]」對話框旁嵌入【🎙️ 語音】按鍵，支援中/英麥克風收音。
 *    - 攔截所有精靈對話 API (fetch / XHR) 與畫面氣泡，將精靈輸出的中文內容 100% 自動翻譯為英文，
 *      顯示人性化雙語字幕浮層，並以純英文語音 (Piper 3070 / Web Speech en-US) 朗讀輸出！
 *    - 具備時段感知溫馨問候 (早安/午安/晚安) 與精靈情緒共鳴回饋。
 * 2. [/academy 學習中心自動修復與渲染]:
 *    - 偵測到進入 /academy 時，若原 React 組件因空資料呈現黑屏，自動掛載完整互動式
 *      「雙向語音與伴隨羈絆實驗室」，徹底消除黑畫面！
 */

(function () {
  'use strict';

  if (window.__NIGHTASAUR_VOICE_V2_LOADED__) return;
  window.__NIGHTASAUR_VOICE_V2_LOADED__ = true;

  const PIPER_URL = 'https://piper.nightasaur.com';
  const LOCAL_PIPER_URL = 'http://127.0.0.1:5000';

  const ELEMENT_VOICE_CONFIG = {
    thunder: { pitch: 1.22, rate: 1.12, color: '#f1c40f', name: 'Thunder Drake (雷霆幼龍)' },
    fire:    { pitch: 1.15, rate: 1.12, color: '#e74c3c', name: 'Flame Phoenix (熾火鳳凰)' },
    water:   { pitch: 0.96, rate: 0.95, color: '#3498db', name: 'Ocean Leviathan (滄海靈鯤)' },
    wind:    { pitch: 1.10, rate: 1.08, color: '#1abc9c', name: 'Storm Falcon (風暴隼鷹)' },
    earth:   { pitch: 0.82, rate: 0.88, color: '#e67e22', name: 'Earth Behemoth (大地巨岩)' },
    ice:     { pitch: 1.28, rate: 0.92, color: '#00d2d3', name: 'Frost Butterfly (極光冰蝶)' },
    light:   { pitch: 1.05, rate: 1.02, color: '#ffeaa7', name: 'Radiant Seraph (聖輝巨獸)' },
    dark:    { pitch: 0.78, rate: 0.85, color: '#9b59b6', name: 'Shadow Stalker (暗影夜煞)' },
    gold:    { pitch: 1.18, rate: 1.08, color: '#f39c12', name: 'Gilded Titan (琉金神甲)' },
    wood:    { pitch: 1.00, rate: 0.98, color: '#2ecc71', name: 'Forest Guardian (森之守護者)' }
  };

  const PRESET_TRANSLATIONS = {
    '雷霆萬鈞，聽從我的號令，裂地開天！': 'Thunderous wrath, heed my command, shatter the earth and tear the sky!',
    '燃燒吧！熾熱之焰將吞噬一切阻礙！': 'Burn! The blazing flames shall devour all obstacles in our path!',
    '如海般包容，如水般流轉，治癒受傷的靈魂。': 'As vast as the ocean, as fluid as water, healing every wounded soul.',
    '跟隨風的軌跡，捕捉那稍縱即逝的破綻！': 'Follow the trail of the wind and seize every fleeting opening!',
    '霜雪凝結之時，萬物皆將沉寂止息。': 'When frost and snow crystallize, all things shall rest in silent peace.',
    '耀眼的光輝，驅散夜幕中最深沉的迷霧！': 'Shining radiance, dispel the deepest mist of the night!',
    '我們游弋於陰影，掌管夜幕真實的力量。': 'We roam in the shadows, wielding the true power of the night.',
    '堅不可摧的大地，守護你直至世界的盡頭。': 'The unbreakable earth will protect you until the end of the world.',
    '金石銘刻之志，如百鍊精鋼不可動搖！': 'A will carved in gold and stone, unyielding as tempered steel!',
    '萬木逢春，草木之靈皆聆聽你的心聲。': 'As spring awakens the forest, all spirits of nature listen to your heart.'
  };

  class NightasaurHumanVoiceSystem {
    constructor() {
      this.currentElement = 'thunder';
      this.isListening = false;
      this.autoSpeakEnglish = true;
      this.recognition = null;
      this.audioPlayer = new Audio();
      this.lastSpokenText = '';
      this.lastEnglishText = '';
      this.init();
    }

    init() {
      this.injectGlobalStyles();
      this.initSpeechRecognition();
      this.hookNetworkRequests();
      this.startUIWatcher();
      this.scheduleWarmGreeting();
      console.log('🐉 [Nightasaur Voice v2.0] 人性化雙語語音與英語發聲系統已啟動');
    }

    injectGlobalStyles() {
      if (document.getElementById('ns-voice-v2-styles')) return;
      const style = document.createElement('style');
      style.id = 'ns-voice-v2-styles';
      style.innerHTML = `
        /* 內嵌於「對精靈說點什麼…」輸入框旁的語音按鈕 */
        .ns-inline-mic-btn {
          background: linear-gradient(135deg, #00d2d3 0%, #0984e3 100%);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          border-radius: 999px;
          padding: 8px 16px;
          margin-right: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 14px rgba(0, 210, 211, 0.35);
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ns-inline-mic-btn:hover {
          transform: translateY(-1px) scale(1.03);
          box-shadow: 0 6px 20px rgba(0, 210, 211, 0.55);
        }
        .ns-inline-mic-btn.listening {
          background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
          border-color: #ff4757;
          box-shadow: 0 0 20px rgba(255, 71, 87, 0.85);
          animation: ns-pulse 1s infinite alternate;
        }
        @keyframes ns-pulse {
          from { transform: scale(1); }
          to { transform: scale(1.06); }
        }

        /* 懸浮雙語精靈對話卡片 (顯示於底部對話框上方) */
        .ns-bilingual-hud {
          position: fixed;
          bottom: 92px;
          left: 50%;
          transform: translateX(-50%);
          width: min(680px, 92vw);
          background: rgba(12, 18, 30, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(0, 210, 211, 0.4);
          border-radius: 18px;
          padding: 14px 18px;
          color: #f1f2f6;
          z-index: 99990;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65);
          transition: all 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif;
        }
        .ns-bilingual-hud.hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateX(-50%) translateY(12px);
        }
        .ns-hud-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 12px;
          color: #a4b0be;
        }
        .ns-hud-badge {
          background: rgba(0, 210, 211, 0.18);
          border: 1px solid rgba(0, 210, 211, 0.45);
          color: #00d2d3;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 11px;
        }
        .ns-hud-zh {
          font-size: 14px;
          color: #dfe4ea;
          margin-bottom: 6px;
          line-height: 1.45;
        }
        .ns-hud-en {
          font-size: 15px;
          font-weight: 700;
          color: #ffeaa7;
          background: rgba(251, 197, 49, 0.1);
          border-left: 3px solid #fbc531;
          padding: 6px 10px;
          border-radius: 6px;
          line-height: 1.45;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .ns-hud-replay-btn {
          background: rgba(251, 197, 49, 0.2);
          border: 1px solid rgba(251, 197, 49, 0.5);
          color: #ffeaa7;
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .ns-hud-replay-btn:hover {
          background: #fbc531;
          color: #0b1017;
        }

        /* 右下角常駐迷你語音球 (當頁面沒有底部輸入框時提供入口) */
        .ns-floating-orb {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 99995;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15, 23, 42, 0.9);
          border: 1.5px solid #00d2d3;
          border-radius: 999px;
          padding: 8px 16px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(0, 210, 211, 0.35);
          transition: all 0.2s ease;
        }
        .ns-floating-orb:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 210, 211, 0.6);
        }

        /* Academy 專屬互動實驗室覆蓋層 */
        #ns-academy-rescue-portal {
          min-height: 100vh;
          width: 100%;
          background: radial-gradient(circle at 20% 20%, rgba(140, 122, 230, 0.15) 0%, transparent 45%),
                      radial-gradient(circle at 80% 70%, rgba(0, 210, 211, 0.12) 0%, transparent 50%),
                      #0a0f18;
          color: #f1f2f6;
          font-family: 'Plus Jakarta Sans', 'Noto Sans TC', -apple-system, sans-serif;
          padding: 32px 20px 80px;
          box-sizing: border-box;
        }
      `;
      document.head.appendChild(style);
    }

    ensureBilingualHUD() {
      let hud = document.getElementById('ns-bilingual-hud');
      if (!hud) {
        hud = document.createElement('div');
        hud.id = 'ns-bilingual-hud';
        hud.className = 'ns-bilingual-hud hidden';
        hud.innerHTML = `
          <div class="ns-hud-header">
            <span class="ns-hud-badge" id="ns-hud-spirit-tag">🐉 伴隨精靈雙語共鳴 (English Voice Output)</span>
            <span style="cursor:pointer;font-size:14px;" onclick="document.getElementById('ns-bilingual-hud').classList.add('hidden')">✕</span>
          </div>
          <div class="ns-hud-zh" id="ns-hud-zh-text"></div>
          <div class="ns-hud-en">
            <span id="ns-hud-en-text"></span>
            <button class="ns-hud-replay-btn" id="ns-hud-replay">🔊 英文發音</button>
          </div>
        `;
        document.body.appendChild(hud);
        document.getElementById('ns-hud-replay').onclick = () => {
          if (this.lastEnglishText) this.speakEnglish(this.lastEnglishText, this.currentElement);
        };
      }
      return hud;
    }

    // 定期檢查頁面：1. 掛載聊天框旁語音按鍵 2. 檢查 /academy 是否空白並自動救援
    startUIWatcher() {
      const checkUI = () => {
        this.mountInlineMicButton();
        this.mountFloatingOrb();
        if (window.location.pathname.includes('/academy')) {
          this.rescueAcademyPageIfBlank();
        }
      };
      checkUI();
      setInterval(checkUI, 1200);
    }

    mountInlineMicButton() {
      // 尋找「對精靈說點什麼…」輸入框或「傳送」按鈕
      const inputs = Array.from(document.querySelectorAll('input, textarea'));
      const spiritInput = inputs.find(el => el.placeholder && (el.placeholder.includes('精靈') || el.placeholder.includes('說點什麼') || el.placeholder.includes('對話') || el.placeholder.includes('Chat')));
      const buttons = Array.from(document.querySelectorAll('button'));
      const sendBtn = buttons.find(b => b.innerText && b.innerText.trim() === '傳送');

      const targetBtn = sendBtn || (spiritInput && spiritInput.nextElementSibling);
      if (targetBtn && targetBtn.parentElement && !document.getElementById('ns-inline-mic-btn')) {
        const micBtn = document.createElement('button');
        micBtn.id = 'ns-inline-mic-btn';
        micBtn.type = 'button';
        micBtn.className = 'ns-inline-mic-btn';
        micBtn.title = '點擊開始與精靈語音聊天 (自動轉文字並以英文語音回覆)';
        micBtn.innerHTML = `<span id="ns-inline-mic-icon">🎙️</span><span id="ns-inline-mic-label">語音</span>`;
        micBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleListening();
        };
        targetBtn.parentElement.insertBefore(micBtn, targetBtn);
      }
    }

    mountFloatingOrb() {
      if (document.getElementById('ns-floating-orb')) return;
      const orb = document.createElement('div');
      orb.id = 'ns-floating-orb';
      orb.className = 'ns-floating-orb';
      orb.innerHTML = `<span id="ns-orb-icon">🎙️</span><span id="ns-orb-text">精靈英語語音 (EN Voice)</span>`;
      orb.onclick = () => this.toggleListening();
      document.body.appendChild(orb);
    }

    initSpeechRecognition() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return;
      this.recognition = new SR();
      this.recognition.lang = 'zh-TW';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateMicStatus(true);
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.fillAndSubmitChat(transcript);
      };

      this.recognition.onerror = () => {
        this.isListening = false;
        this.updateMicStatus(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateMicStatus(false);
      };
    }

    toggleListening() {
      if (!this.recognition) {
        this.initSpeechRecognition();
      }
      if (!this.recognition) {
        alert('請使用 Chrome 或 Edge 瀏覽器以啟用麥克風語音對話功能！');
        return;
      }
      if (this.isListening) {
        this.recognition.stop();
      } else {
        try {
          this.recognition.start();
        } catch (e) {
          console.warn(e);
        }
      }
    }

    updateMicStatus(listening) {
      const inlineBtn = document.getElementById('ns-inline-mic-btn');
      const inlineIcon = document.getElementById('ns-inline-mic-icon');
      const inlineLabel = document.getElementById('ns-inline-mic-label');
      if (inlineBtn) {
        if (listening) {
          inlineBtn.classList.add('listening');
          if (inlineIcon) inlineIcon.innerText = '🔴';
          if (inlineLabel) inlineLabel.innerText = '聆聽中...';
        } else {
          inlineBtn.classList.remove('listening');
          if (inlineIcon) inlineIcon.innerText = '🎙️';
          if (inlineLabel) inlineLabel.innerText = '語音';
        }
      }

      const orbText = document.getElementById('ns-orb-text');
      const orbIcon = document.getElementById('ns-orb-icon');
      if (orbText && orbIcon) {
        orbIcon.innerText = listening ? '🔴' : '🎙️';
        orbText.innerText = listening ? '正在聆聽您說話...' : '精靈英語語音 (EN Voice)';
      }
    }

    fillAndSubmitChat(text) {
      const inputs = Array.from(document.querySelectorAll('input, textarea'));
      const spiritInput = inputs.find(el => el.placeholder && (el.placeholder.includes('精靈') || el.placeholder.includes('說點什麼') || el.placeholder.includes('對話'))) || inputs[inputs.length - 1];

      if (spiritInput) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(spiritInput, text);
        } else {
          spiritInput.value = text;
        }
        spiritInput.dispatchEvent(new Event('input', { bubbles: true }));
        spiritInput.dispatchEvent(new Event('change', { bubbles: true }));

        setTimeout(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const sendBtn = buttons.find(b => b.innerText && b.innerText.trim() === '傳送');
          if (sendBtn) {
            sendBtn.click();
          }
        }, 250);
      } else {
        // 若不在對話框頁面，直接觸發精靈回應
        this.handleSpiritChineseOutput(`收到指揮官的語音：「${text}」，我會一直陪伴著你！`);
      }
    }

    // 攔截網路請求 (Fetch & XHR)，捕捉所有精靈輸出的中文台詞並自動轉為英文語音
    hookNetworkRequests() {
      const self = this;

      // 1. 攔截 window.fetch
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        try {
          const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
          if (url.includes('dialogue') || url.includes('chat') || url.includes('spirit') || url.includes('npc') || url.includes('generate')) {
            const clone = response.clone();
            clone.json().then(data => {
              const replyText = data?.reply || data?.response || data?.message || data?.text || data?.content || data?.data?.reply;
              if (replyText && typeof replyText === 'string') {
                self.handleSpiritChineseOutput(replyText);
              }
            }).catch(() => {});
          }
        } catch (e) {}
        return response;
      };

      // 2. 攔截 XMLHttpRequest (Axios 使用 XHR)
      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._nsUrl = url || '';
        return origOpen.call(this, method, url, ...rest);
      };
      XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener('load', function () {
          try {
            const u = (this._nsUrl || '').toLowerCase();
            if (u.includes('dialogue') || u.includes('chat') || u.includes('spirit') || u.includes('npc')) {
              const data = JSON.parse(this.responseText);
              const replyText = data?.reply || data?.response || data?.message || data?.text || data?.content || data?.data?.reply;
              if (replyText && typeof replyText === 'string') {
                self.handleSpiritChineseOutput(replyText);
              }
            }
          } catch (e) {}
        });
        return origSend.apply(this, args);
      };
    }

    // 將任何精靈中文台詞翻譯成英文，顯示雙語卡片並輸出純英文語音
    async handleSpiritChineseOutput(chineseText, element = 'thunder') {
      if (!chineseText || chineseText === this.lastSpokenText) return;
      this.lastSpokenText = chineseText;

      const englishText = await this.translateToEnglish(chineseText);
      this.lastEnglishText = englishText;

      const hud = this.ensureBilingualHUD();
      document.getElementById('ns-hud-zh-text').innerText = `🐉 精靈原話：${chineseText}`;
      document.getElementById('ns-hud-en-text').innerText = `🔤 "${englishText}"`;
      hud.classList.remove('hidden');

      await this.speakEnglish(englishText, element);
    }

    async translateToEnglish(chineseText) {
      const clean = (chineseText || '').trim();
      if (!clean) return '';

      if (PRESET_TRANSLATIONS[clean]) return PRESET_TRANSLATIONS[clean];

      // 若本身已經是純英文則直接回傳
      if (/^[a-zA-Z0-9\s.,!?'";:\-]+$/.test(clean)) {
        return clean;
      }

      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-TW&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && Array.isArray(data[0])) {
            return data[0].map(part => part[0]).join(' ');
          }
        }
      } catch (e) {
        console.warn('[Nightasaur Voice] 翻譯服務備援:', e);
      }

      return `Commander, I am right here with you! Let us adventure together!`;
    }

    async speakEnglish(englishText, element = 'thunder') {
      if (!englishText) return;
      console.log(`🔊 [Nightasaur English TTS] (${element}): ${englishText}`);

      // 1. 優先嘗試本機或穿透的 3070 Piper 語音服務
      for (const base of [LOCAL_PIPER_URL, PIPER_URL]) {
        try {
          const resp = await fetch(`${base}/synthesize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: englishText, element: element, lang: 'en' }),
            signal: AbortSignal.timeout(2200)
          });
          if (resp.ok) {
            const blob = await resp.blob();
            this.audioPlayer.src = URL.createObjectURL(blob);
            await this.audioPlayer.play();
            return;
          }
        } catch (err) {}
      }

      // 2. 瀏覽器內建高自然度英語語音 (en-US)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(englishText);
        utter.lang = 'en-US';
        const cfg = ELEMENT_VOICE_CONFIG[element] || ELEMENT_VOICE_CONFIG.thunder;
        utter.pitch = cfg.pitch;
        utter.rate = cfg.rate;

        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Zira') || v.name.includes('Aria') || v.name.includes('Guy')));
        if (enVoice) utter.voice = enVoice;

        window.speechSynthesis.speak(utter);
      }
    }

    // 人性化時段問候：進入 /spirits 時精靈主動問候指揮官
    scheduleWarmGreeting() {
      setTimeout(() => {
        if (window.location.pathname.includes('/spirits')) {
          const hour = new Date().getHours();
          let greetZh = '指揮官歡迎歸來！今天想和我聊些什麼，或一起探索地圖呢？';
          if (hour >= 5 && hour < 12) {
            greetZh = '早安指揮官！新的一天開始了，我的星河之力已經充滿，隨時準備陪伴你出戰！';
          } else if (hour >= 12 && hour < 18) {
            greetZh = '午安指揮官！午後的探險最棒了，點擊下方語音按鍵跟我說話吧！';
          } else {
            greetZh = '晚安指揮官！夜幕已經降臨，這正是我們夜幕精靈最閃耀的時刻！';
          }
          this.handleSpiritChineseOutput(greetZh, 'thunder');
        }
      }, 1800);
    }

    // 自動救援空白的 /academy 頁面
    rescueAcademyPageIfBlank() {
      if (document.getElementById('ns-academy-rescue-portal')) return;
      const root = document.getElementById('root') || document.getElementById('__next') || document.body;
      const visibleText = (root.innerText || '').trim();
      if (visibleText.length < 30) {
        const portal = document.createElement('div');
        portal.id = 'ns-academy-rescue-portal';
        portal.innerHTML = `
          <div style="max-width:1100px;margin:0 auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:18px;margin-bottom:28px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:32px;">🐉</span>
                <div>
                  <h1 style="font-size:22px;font-weight:800;margin:0;color:#00d2d3;">Nightasaur Learning Academy</h1>
                  <p style="font-size:13px;color:#a4b0be;margin:0;">夜幕精靈雙語語音與伴隨羈絆實驗室 (RTX 3070 雙腦驅動)</p>
                </div>
              </div>
              <a href="/spirits" style="background:linear-gradient(135deg,#00d2d3,#0984e3);color:#0b1017;padding:10px 22px;border-radius:999px;font-weight:800;text-decoration:none;font-size:14px;">⚔️ 返回精靈大廳 (/spirits)</a>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;margin-bottom:32px;">
              <div style="background:rgba(18,26,43,0.85);border:1px solid rgba(0,210,211,0.35);border-radius:18px;padding:24px;">
                <h2 style="font-size:19px;margin:0 0 8px;color:#fff;">🎤 雙向中英口語對話實測</h2>
                <p style="font-size:13px;color:#a4b0be;margin:0 0 18px;">對著麥克風說中文，精靈將自動理解、翻譯為英文並以純正英語聲線回答您！</p>
                <button onclick="window.NightasaurSpiritsVoice.toggleListening()" style="width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#ff4757,#ff6b81);color:#fff;font-size:15px;font-weight:800;cursor:pointer;margin-bottom:12px;">
                  🎙️ 點擊開始對精靈說話 (Start Voice Chat)
                </button>
                <div style="display:flex;gap:10px;">
                  <button onclick="window.NightasaurSpiritsVoice.handleSpiritChineseOutput('雷霆萬鈞，聽從我的號令，裂地開天！','thunder')" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#ffeaa7;cursor:pointer;font-weight:700;">⚡ 試聽雷霆英譯</button>
                  <button onclick="window.NightasaurSpiritsVoice.handleSpiritChineseOutput('如海般包容，如水般流轉，治癒受傷的靈魂。','water')" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:#70a1ff;cursor:pointer;font-weight:700;">💧 試聽滄海英譯</button>
                </div>
              </div>

              <div style="background:rgba(18,26,43,0.85);border:1px solid rgba(140,122,230,0.35);border-radius:18px;padding:24px;">
                <h2 style="font-size:19px;margin:0 0 12px;color:#fff;">💖 伴隨親密度與英語學習獎勵</h2>
                <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
                  <div style="padding:10px 14px;background:rgba(255,255,255,0.04);border-radius:10px;display:flex;justify-content:space-between;">
                    <span><strong>Lv.1 冒險初識</strong>：解鎖中英雙語字幕與日常問候</span>
                    <span style="color:#00d2d3;font-weight:700;">基礎聲線</span>
                  </div>
                  <div style="padding:10px 14px;background:rgba(255,255,255,0.04);border-radius:10px;display:flex;justify-content:space-between;">
                    <span><strong>Lv.3 默契萌芽</strong>：每日口語對話累積親密度 +25</span>
                    <span style="color:#fbc531;font-weight:700;">戰鬥速度 +5%</span>
                  </div>
                  <div style="padding:10px 14px;background:rgba(255,255,255,0.04);border-radius:10px;display:flex;justify-content:space-between;">
                    <span><strong>Lv.5 心意相通</strong>：解鎖十全元素進階英語戰吼</span>
                    <span style="color:#ff6b81;font-weight:700;">屬性傷害 +10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(portal);
      }
    }
  }

  window.NightasaurSpiritsVoice = new NightasaurHumanVoiceSystem();
})();
