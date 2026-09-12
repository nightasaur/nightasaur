import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";
import { PrismaClient } from "@prisma/client";
import { spiritService } from "./spirit.js";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// 預設管理員帳號資料
const DEFAULT_ADMIN = {
  email: "admin@nightasaur.com",
  username: "Nightasaur管理員",
  password: "admin123!",
  role: "ADMIN" as const,
};

// 預設示範帳號資料
const DEFAULT_DEMO = {
  email: "demo@nightasaur.com",
  username: "精靈訓練家",
  password: "demo1234",
  role: "USER" as const,
};

// 確保預設帳號存在
async function ensureDefaultUsers() {
  try {
    // 檢查並創建管理員帳號
    let adminUser = await prisma.user.findFirst({ where: { email: DEFAULT_ADMIN.email } });
    if (!adminUser) {
      const adminHash = await bcrypt.hash(DEFAULT_ADMIN.password, SALT_ROUNDS);
      adminUser = await prisma.user.create({
        data: {
          email: DEFAULT_ADMIN.email,
          username: DEFAULT_ADMIN.username,
          passwordHash: adminHash,
          role: DEFAULT_ADMIN.role,
          isActive: true,
          bio: "Nightasaur 系統管理員"
        }
      });
      console.log(`✅ 管理員帳號已創建: ${DEFAULT_ADMIN.email}`);
    }

    // 檢查並創建示範帳號
    let demoUser = await prisma.user.findFirst({ where: { email: DEFAULT_DEMO.email } });
    if (!demoUser) {
      const demoHash = await bcrypt.hash(DEFAULT_DEMO.password, SALT_ROUNDS);
      demoUser = await prisma.user.create({
        data: {
          email: DEFAULT_DEMO.email,
          username: DEFAULT_DEMO.username,
          passwordHash: demoHash,
          role: DEFAULT_DEMO.role,
          isActive: true,
          bio: "示範用戶，擁有3隻精靈"
        }
      });
      console.log(`✅ 示範帳號已創建: ${DEFAULT_DEMO.email}`);
    }

    console.log("✅ 預設帳號已確保存在");
    console.log(`   Admin: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`);
    console.log(`   Demo: ${DEFAULT_DEMO.email} / ${DEFAULT_DEMO.password}`);
  } catch (error) {
    console.error("❌ 確保預設帳號時發生錯誤:", error);
  }
}

// 初始化時確保預設帳號存在
ensureDefaultUsers().catch(console.error);

// 元素列表
const ELEMENTS = ["FIRE", "WATER", "LIGHT", "SHADOW", "STAR", "ILLUSION", "MOON", "NATURE", "THUNDER", "ICE"];

// 隨機選擇一個元素
function getRandomElement() {
  return ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
}

// 根據元素生成精靈名稱
function generateSpiritName(element: string, username: string) {
  const elementNames: Record<string, string[]> = {
    FIRE: ["焰火", "炎龍", "火鳳", "灼光", "熾焰"],
    WATER: ["清流", "海龍", "水靈", "波光", "潮汐"],
    LIGHT: ["光輝", "聖光", "晨曦", "輝耀", "明焰"],
    SHADOW: ["暗影", "夜魅", "幽魂", "暗夜", "黑影"],
    STAR: ["星塵", "星雲", "星河", "星輝", "星耀"],
    ILLUSION: ["幻影", "迷霧", "幻象", "夢境", "虛幻"],
    MOON: ["月影", "月華", "月光", "月神", "月輝"],
    NATURE: ["綠葉", "森林", "大地", "生命", "自然"],
    THUNDER: ["雷電", "雷霆", "閃電", "雷鳴", "電光"],
    ICE: ["冰霜", "冰雪", "冰晶", "寒冰", "霜雪"]
  };
  
  const names = elementNames[element] || ["小精靈"];
  const randomName = names[Math.floor(Math.random() * names.length)];
  return `${username}的${randomName}`;
}

export class AuthService {
  async register(email: string, username: string, password: string) {
    // 檢查是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "使用者名稱";
      throw Object.assign(new Error(`${field}已被使用`), { statusCode: 409 });
    }

    // 建立使用者
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: "USER",
        isActive: true,
        avatarUrl: null,
        bio: null
      }
    });

    // 為新用戶創建初始精靈
    let initialSpirit = null;
    try {
      const element = getRandomElement();
      const spiritName = generateSpiritName(element, username);
      
      initialSpirit = await spiritService.createSpirit({
        userId: user.id,
        name: spiritName,
        element: element,
        personality: "活潑好奇，喜歡探索新事物",
        appearance: "小巧可愛，散發著溫和的光芒",
        species: "初始精靈"
      });
      
      console.log(`✅ 為新用戶 ${email} 創建初始精靈: ${spiritName} (${element})`);
    } catch (spiritError) {
      console.error("❌ 創建初始精靈時發生錯誤:", spiritError);
      // 不讓精靈創建失敗影響註冊流程
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
      spirit: initialSpirit ? {
        id: initialSpirit.id,
        name: initialSpirit.name,
        element: initialSpirit.element,
        stage: initialSpirit.stage,
        level: initialSpirit.level
      } : null
    };
  }

  async login(email: string, password: string) {
    // 查找使用者
    const user = await prisma.user.findFirst({
      where: { email }
    });
    
    if (!user) {
      throw Object.assign(new Error("Email 或密碼錯誤"), { statusCode: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw Object.assign(new Error("Email 或密碼錯誤"), { statusCode: 401 });
    }

    if (!user.isActive) {
      throw Object.assign(new Error("帳號已被停用"), { statusCode: 403 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  async logout(token: string) {
    // 這裡可以實現令牌黑名單或其他登出邏輯
    // 目前只是簡單實現
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Spirits: {  // 注意：大寫 S，因為 Schema 中是 Spirits
          where: { isActive: true },
          take: 10
        }
      }
    });

    if (!user) {
      throw Object.assign(new Error("使用者不存在"), { statusCode: 404 });
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      spiritCount: user.Spirits.length,
      spirits: user.Spirits.slice(0, 5).map(spirit => ({
        id: spirit.id,
        name: spirit.name,
        element: spirit.element,
        stage: spirit.stage,
        level: spirit.level,
        species: spirit.species
      })),
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
