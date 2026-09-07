import prisma from "../src/config/prisma.js";

// 遊戲核心翻譯數據
const CORE_TRANSLATIONS = [
  // 通用模組
  {
    key: "app_name",
    module: "common",
    zhTW: "夜龍精靈",
    zhCN: "夜龙精灵",
    enUS: "Nightasaur",
    jaJP: "ナイトサウル",
    koKR: "나이트사우르",
    description: "應用程式名稱",
    context: "主標題"
  },
  {
    key: "loading",
    module: "common",
    zhTW: "載入中...",
    zhCN: "加载中...",
    enUS: "Loading...",
    jaJP: "読み込み中...",
    koKR: "로딩 중...",
    description: "載入提示",
    context: "載入狀態"
  },
  {
    key: "save",
    module: "common",
    zhTW: "儲存",
    zhCN: "保存",
    enUS: "Save",
    jaJP: "保存",
    koKR: "저장",
    description: "儲存按鈕",
    context: "按鈕"
  },
  {
    key: "cancel",
    module: "common",
    zhTW: "取消",
    zhCN: "取消",
    enUS: "Cancel",
    jaJP: "キャンセル",
    koKR: "취소",
    description: "取消按鈕",
    context: "按鈕"
  },
  {
    key: "confirm",
    module: "common",
    zhTW: "確認",
    zhCN: "确认",
    enUS: "Confirm",
    jaJP: "確認",
    koKR: "확인",
    description: "確認按鈕",
    context: "按鈕"
  },
  
  // 菜單模組
  {
    key: "main_menu",
    module: "menu",
    zhTW: "主選單",
    zhCN: "主菜单",
    enUS: "Main Menu",
    jaJP: "メインメニュー",
    koKR: "메인 메뉴",
    description: "主選單標題",
    context: "導航"
  },
  {
    key: "settings",
    module: "menu",
    zhTW: "設定",
    zhCN: "设置",
    enUS: "Settings",
    jaJP: "設定",
    koKR: "설정",
    description: "設定選項",
    context: "導航"
  },
  {
    key: "language_settings",
    module: "menu",
    zhTW: "語言設定",
    zhCN: "语言设置",
    enUS: "Language Settings",
    jaJP: "言語設定",
    koKR: "언어 설정",
    description: "語言設定選項",
    context: "設定子選單"
  },
  {
    key: "game_settings",
    module: "menu",
    zhTW: "遊戲設定",
    zhCN: "游戏设置",
    enUS: "Game Settings",
    jaJP: "ゲーム設定",
    koKR: "게임 설정",
    description: "遊戲設定選項",
    context: "設定子選單"
  },
  {
    key: "sound_settings",
    module: "menu",
    zhTW: "音效設定",
    zhCN: "音效设置",
    enUS: "Sound Settings",
    jaJP: "サウンド設定",
    koKR: "사운드 설정",
    description: "音效設定選項",
    context: "設定子選單"
  },
  
  // 設定模組
  {
    key: "language",
    module: "settings",
    zhTW: "語言",
    zhCN: "语言",
    enUS: "Language",
    jaJP: "言語",
    koKR: "언어",
    description: "語言設定標題",
    context: "設定頁面"
  },
  {
    key: "display_mode",
    module: "settings",
    zhTW: "顯示模式",
    zhCN: "显示模式",
    enUS: "Display Mode",
    jaJP: "表示モード",
    koKR: "표시 모드",
    description: "顯示模式設定",
    context: "設定頁面"
  },
  {
    key: "single_language",
    module: "settings",
    zhTW: "單一語言",
    zhCN: "单一语言",
    enUS: "Single Language",
    jaJP: "単一言語",
    koKR: "단일 언어",
    description: "單一語言模式",
    context: "顯示模式選項"
  },
  {
    key: "bilingual",
    module: "settings",
    zhTW: "雙語顯示",
    zhCN: "双语显示",
    enUS: "Bilingual",
    jaJP: "二言語表示",
    koKR: "이중 언어",
    description: "雙語顯示模式",
    context: "顯示模式選項"
  },
  {
    key: "auto_switch",
    module: "settings",
    zhTW: "自動切換",
    zhCN: "自动切换",
    enUS: "Auto Switch",
    jaJP: "自動切替",
    koKR: "자동 전환",
    description: "自動切換模式",
    context: "顯示模式選項"
  },
  {
    key: "primary_language",
    module: "settings",
    zhTW: "主要語言",
    zhCN: "主要语言",
    enUS: "Primary Language",
    jaJP: "主要言語",
    koKR: "주요 언어",
    description: "主要語言設定",
    context: "語言設定"
  },
  {
    key: "secondary_language",
    module: "settings",
    zhTW: "次要語言",
    zhCN: "次要语言",
    enUS: "Secondary Language",
    jaJP: "補助言語",
    koKR: "보조 언어",
    description: "次要語言設定",
    context: "語言設定"
  }