import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";
import { PrismaClient } from "@prisma/client";

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
