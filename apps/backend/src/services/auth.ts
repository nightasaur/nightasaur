import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";
import { PrismaClient } from "@prisma/client";
import { spiritService } from "./spirit.js";

const SALT_ROUNDS = 12;

// 記憶體中的暫存使用者（當資料庫不可用時）
const inMemoryUsers = new Map();

export class AuthService {
  private prisma: PrismaClient | null = null;
  private isDatabaseConnected: boolean = false;

  constructor() {
    this.initializeDatabase();
  }

  // 初始化資料庫連線
  async initializeDatabase() {
    try {
      this.prisma = new PrismaClient();
      await this.prisma.$connect();
      this.isDatabaseConnected = true;
      console.log("✅ 資料庫連線成功");
      
      // 確保預設帳號存在
      await this.ensureDefaultUsers();
    } catch (error: any) {
      console.warn("⚠️  資料庫連線失敗，使用記憶體模式:", error.message);
      this.isDatabaseConnected = false;
      this.prisma = null;
    }
  }

  // 確保預設帳號存在
  async ensureDefaultUsers() {
    if (!this.isDatabaseConnected) return;

    const DEFAULT_ADMIN = {
      email: "admin@nightasaur.com",
      username: "Nightasaur管理員",
      password: "admin123!",
      role: "ADMIN" as const,
    };

    const DEFAULT_DEMO = {
      email: "demo@nightasaur.com",
      username: "精靈訓練家",
      password: "demo1234",
      role: "USER" as const,
    };

    try {
      // 檢查並創建管理員帳號
      let adminUser = await this.prisma!.user.findFirst({ where: { email: DEFAULT_ADMIN.email } });
      if (!adminUser) {
        const adminHash = await bcrypt.hash(DEFAULT_ADMIN.password, SALT_ROUNDS);
        adminUser = await this.prisma!.user.create({
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
      let demoUser = await this.prisma!.user.findFirst({ where: { email: DEFAULT_DEMO.email } });
      if (!demoUser) {
        const demoHash = await bcrypt.hash(DEFAULT_DEMO.password, SALT_ROUNDS);
        demoUser = await this.prisma!.user.create({
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
    } catch (error) {
      console.error("❌ 確保預設帳號時發生錯誤:", error);
    }
  }

  // 元素列表
  getElements() {
    return ["FIRE", "WATER", "LIGHT", "SHADOW", "STAR", "ILLUSION", "MOON", "NATURE", "THUNDER", "ICE"];
  }

  // 隨機選擇一個元素
  getRandomElement() {
    const elements = this.getElements();
    return elements[Math.floor(Math.random() * elements.length)];
  }

  // 根據元素生成精靈名稱
  generateSpiritName(element: string, username: string) {
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

// 註冊功能 - 支援資料庫和記憶體兩種模式
  async register(email: string, username: string, password: string) {
    try {
      // 基本驗證
      if (!email || !username || !password) {
        throw { 
          success: false, 
          message: "請填寫所有必填欄位",
          statusCode: 400 
        };
      }

      if (password.length < 8) {
        throw { 
          success: false, 
          message: "密碼至少需要8個字元",
          statusCode: 400 
        };
      }

      // 檢查 Email 格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw { 
          success: false, 
          message: "請輸入有效的 Email 地址",
          statusCode: 400 
        };
      }

      // 資料庫模式
      if (this.isDatabaseConnected && this.prisma) {
        // 檢查是否已存在
        const existingUser = await this.prisma.user.findFirst({
          where: {
            OR: [{ email }, { username }]
          }
        });

        if (existingUser) {
          const field = existingUser.email === email ? "Email" : "使用者名稱";
          throw { 
            success: false, 
            message: `該${field}已被註冊`,
            statusCode: 409 
          };
        }

        // 加密密碼
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // 創建使用者
        const user = await this.prisma.user.create({
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
          const element = this.getRandomElement();
          const spiritName = this.generateSpiritName(element, username);
          
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

        // 生成 JWT Token
        const token = signToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        return {
          success: true,
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
          } : null,
          mode: "database"
        };

      } else {
        // 記憶體模式 (資料庫不可用時的降級方案)
        console.warn("⚠️  資料庫不可用，使用記憶體模式註冊");

        // 檢查記憶體中是否已存在
        for (const [_key, user] of inMemoryUsers.entries()) {
          if (user.email === email || user.username === username) {
            const field = user.email === email ? "Email" : "使用者名稱";
            throw { 
              success: false, 
              message: `該${field}已被註冊 (記憶體模式)`,
              statusCode: 409 
            };
          }
        }

        // 加密密碼
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // 創建記憶體使用者
        const userId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const user = {
          id: userId,
          email,
          username,
          passwordHash,
          role: "USER",
          isActive: true,
          avatarUrl: null,
          bio: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // 儲存到記憶體
        inMemoryUsers.set(userId, user);

        // 生成 JWT Token (使用記憶體模式的特殊秘密)
        const token = signToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        console.log(`✅ 記憶體模式註冊成功: ${email} (使用者數: ${inMemoryUsers.size})`);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
          },
          token,
          spirit: null, // 記憶體模式不創建精靈
          mode: "memory",
          warning: "目前使用記憶體模式，資料不會永久保存。請檢查資料庫連線設定。"
        };
      }

    } catch (error: any) {
      // 如果錯誤已經是結構化的，直接回傳
      if (error.success !== undefined) {
        throw error;
      }

      // 處理其他錯誤
      console.error("❌ 註冊過程中發生錯誤:", error);
      
      throw { 
        success: false, 
        message: error.message || "註冊失敗，請稍後再試",
        statusCode: error.statusCode || 500,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      };
    }
  }

  async login(email: string, password: string) {
    // 查找使用者
    const user = await this.prisma!.user.findFirst({
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

  async logout(_token: string) {
    // 這裡可以實現令牌黑名單或其他登出邏輯
    // 目前只是簡單實現
  }

  async getProfile(userId: string) {
    const user = await this.prisma!.user.findUnique({
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
