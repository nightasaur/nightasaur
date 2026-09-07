import { NAMING_SYSTEM_CONFIG, namingRequestSchema, namingSuggestionSchema, namingValidationSchema } from "../utils/namingSystem.js";
import prisma from "../config/prisma.js";

// 命名資料庫（可擴展）
const NAME_DATABASE = {
  // 中文命名詞庫
  zh_TW: {
    PREFIXES: ["小", "大", "阿", "老", "超", "巨", "微", "星", "月", "日"],
    SUFFIXES: ["兒", "子", "寶", "仔", "怪", "獸", "靈", "魂", "龍", "鳳"],
    ADJECTIVES: ["可愛", "勇敢", "聰明", "神秘", "強大", "溫柔", "活潑", "沉穩", "優雅", "狂野"],
    NOUNS: ["火焰", "水流", "光芒", "暗影", "星辰", "幻象", "月亮", "自然", "雷電", "冰雪"]
  },
  
  // 英文命名詞庫
  en_US: {
    PREFIXES: ["Little", "Big", "Super", "Mega", "Micro", "Star", "Moon", "Sun", "Fire", "Ice"],
    SUFFIXES: ["-ling", "-let", "-y", "-ie", "-mon", "-dra", "-phoenix", "-wolf", "-fox", "-cat"],
    ADJECTIVES: ["Cute", "Brave", "Smart", "Mysterious", "Powerful", "Gentle", "Lively", "Calm", "Elegant", "Wild"],
    NOUNS: ["Flame", "Wave", "Light", "Shadow", "Star", "Illusion", "Moon", "Nature", "Thunder", "Ice"]
  },
  
  // 日文命名詞庫
  ja_JP: {
    PREFIXES: ["小", "大", "超", "星", "月", "炎", "水", "光", "闇", "雷"],
    SUFFIXES: ["ちゃん", "くん", "たん", "モン", "ドラ", "フェニックス", "ウルフ", "フォックス", "キャット", "スピリット"],
    ADJECTIVES: ["可愛い", "勇敢な", "賢い", "神秘的な", "強い", "優しい", "活発な", "落ち着いた", "優雅な", "野生の"],
    NOUNS: ["炎", "波", "光", "影", "星", "幻", "月", "自然", "雷", "氷"]
  }
};

// 元素對應的命名主題擴展
const ELEMENT_THEMES_EXPANDED = {
  FIRE: {
    zh_TW: ["烈焰", "炎龍", "火鳳", "灼熱", "熔岩", "爆炎", "烽火", "燦陽"],
    en_US: ["Blaze", "Inferno", "Phoenix", "Scorch", "Magma", "Pyro", "Ember", "Solar"],
    ja_JP: ["炎", "火龍", "鳳凰", "灼熱", "溶岩", "爆炎", "烽火", "太陽"]
  },
  WATER: {
    zh_TW: ["潮汐", "海龍", "水精", "波瀾", "深淵", "浪花", "清泉", "海洋"],
    en_US: ["Tide", "Leviathan", "Nymph", "Wave", "Abyss", "Splash", "Spring", "Ocean"],
    ja_JP: ["潮", "海竜", "水精", "波", "深淵", "波しぶき", "清泉", "海洋"]
  },
  LIGHT: {
    zh_TW: ["光明", "聖光", "輝耀", "晨曦", "白晝", "燦爛", "炫光", "神聖"],
    en_US: ["Luminous", "Holy", "Radiant", "Dawn", "Daylight", "Brilliant", "Glare", "Divine"],
    ja_JP: ["光", "聖光", "輝き", "夜明け", "昼光", "輝かしい", "眩光", "神聖"]
  },
  SHADOW: {
    zh_TW: ["暗影", "幽冥", "黑夜", "虛無", "幽靈", "魅影", "黑暗", "深淵"],
    en_US: ["Shadow", "Abyssal", "Night", "Void", "Phantom", "Wraith", "Darkness", "Abyss"],
    ja_JP: ["影", "幽冥", "夜", "虚無", "幽霊", "幻影", "闇", "深淵"]
  },
  STAR: {
    zh_TW: ["星辰", "銀河", "宇宙", "星塵", "流星", "星座", "星雲", "天體"],
    en_US: ["Stellar", "Galaxy", "Cosmos", "Stardust", "Meteor", "Constellation", "Nebula", "Celestial"],
    ja_JP: ["星", "銀河", "宇宙", "星屑", "流星", "星座", "星雲", "天体"]
  }
};
export class NamingService {
  // 生成命名建議
  async generateSuggestions(request: {
    element: string;
    count?: number;
    language?: string;
    style?: string;
  }) {
    const { element, count = 5, language = "zh-TW", style = "CLASSIC" } = request;
    const langKey = language.replace("-", "_") as keyof typeof NAME_DATABASE;
    const elementKey = element as keyof typeof ELEMENT_THEMES_EXPANDED;
    
    const db = NAME_DATABASE[langKey] || NAME_DATABASE.zh_TW;
    const themes = ELEMENT_THEMES_EXPANDED[elementKey]?.[langKey] || [];
    
    const suggestions: string[] = [];
    
    // 根據風格生成不同類型的名字
    for (let i = 0; i < count; i++) {
      let name = "";
      
      switch (style) {
        case "CLASSIC":
          // 經典風格：前綴 + 主題詞
          name = this.getRandomItem(db.PREFIXES) + 
                 this.getRandomItem(themes.length > 0 ? themes : [this.getRandomItem(db.NOUNS)]);
          break;
          
        case "MYTHICAL":
          // 神話風格：主題詞 + 神話後綴
          name = this.getRandomItem(themes.length > 0 ? themes : [this.getRandomItem(db.NOUNS)]) +
                 this.getRandomItem(["龍", "鳳", "麒麟", "朱雀", "白虎", "玄武", "青龍"]);
          break;
          
        case "NATURE":
          // 自然風格：形容詞 + 名詞
          name = this.getRandomItem(db.ADJECTIVES) + 
                 this.getRandomItem(db.NOUNS);
          break;
          
        case "MODERN":
          // 現代風格：簡潔單詞
          name = this.getRandomItem(themes.length > 0 ? themes : [this.getRandomItem(db.NOUNS)]);
          break;
          
        case "CUTE":
          // 可愛風格：疊字或可愛後綴
          const base = this.getRandomItem(themes.length > 0 ? themes : [this.getRandomItem(db.NOUNS)]);
          name = base + base.slice(-1); // 疊字
          break;
          
        default:
          name = this.getRandomItem(db.PREFIXES) + 
                 this.getRandomItem(themes.length > 0 ? themes : [this.getRandomItem(db.NOUNS)]);
      }
      
      // 確保名稱長度合適
      if (name.length > NAMING_SYSTEM_CONFIG.RULES.MAX_LENGTH) {
        name = name.slice(0, NAMING_SYSTEM_CONFIG.RULES.MAX_LENGTH);
      }
      
      suggestions.push(name);
    }
    
    return suggestions;
  }
  
  // 驗證名稱
  async validateName(name: string, userId?: string) {
    const validation = namingValidationSchema.safeParse({ name, userId });
    
    if (!validation.success) {
      return {
        valid: false,
        errors: validation.error.errors.map(err => err.message)
      };
    }
    
    // 檢查是否已存在相同名稱的精靈（同用戶）
    if (userId) {
      const existing = await prisma.spirit.findFirst({
        where: { 
          name: name,
          userId: userId 
        }
      });
      
      if (existing) {
        return {
          valid: false,
          errors: ["你已經有同名精靈了！"]
        };
      }
    }
    
    // 檢查名稱的適宜性（可擴展為AI評估）
    const appropriateness = this.assessNameAppropriateness(name);
    
    return {
      valid: true,
      score: appropriateness.score,
      feedback: appropriateness.feedback
    };
  }
  
  // 評估名稱適宜性
  private assessNameAppropriateness(name: string) {
    let score = 100;
    const feedback: string[] = [];
    
    // 長度評估
    if (name.length < 3) {
      score -= 20;
      feedback.push("名稱較短，建議使用2-3個字");
    } else if (name.length > 10) {
      score -= 10;
      feedback.push("名稱較長，建議縮短以便記憶");
    }
    
    // 字符多樣性評估
    const uniqueChars = new Set(name).size;
    if (uniqueChars < 2) {
      score -= 30;
      feedback.push("字符重複過多，建議增加多樣性");
    }
    
    // 可讀性評估（簡單啟發式）
    const hasSpecialChars = /[^\u4e00-\u9fa5a-zA-Z0-9]/.test(name);
    if (hasSpecialChars) {
      score -= 15;
      feedback.push("包含特殊字符，可能影響可讀性");
    }
    
    return {
      score: Math.max(0, score),
      feedback: feedback.length > 0 ? feedback : ["名稱很合適！"]
    };
  }
  
  // 獲取隨機項目
  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  // AI輔助命名（可擴展為調用AI服務）
  async getAISuggestions(element: string, personality?: string) {
    // 這裡可以集成AI命名服務
    // 目前返回基於元素的基礎建議
    return this.generateSuggestions({
      element,
      count: 3,
      style: "MODERN"
    });
  }
}

export const namingService = new NamingService();