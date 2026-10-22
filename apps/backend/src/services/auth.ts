import bcrypt from "bcryptjs";
import { isRetiredPassword } from "../utils/passwordPolicy.js";
import { issueSession, revokeSession } from "./sessions.js";
import prisma from "../config/prisma.js";
import { spiritService } from "./spirit.js";
import { AUTHORIZED_ADMIN_EMAILS } from "../config/admin.js";

const SALT_ROUNDS = 12;

const ELEMENTS = ["FIRE", "WATER", "LIGHT", "SHADOW", "STAR", "ILLUSION", "MOON", "NATURE", "THUNDER", "ICE"];

function getRandomElement() {
  return ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
}

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

async function ensureAdminRoleIfAuthorized(user: { id: string; email: string; role: string }): Promise<string> {
  const cleanEmail = (user.email || "").trim().toLowerCase();
  if (AUTHORIZED_ADMIN_EMAILS.has(cleanEmail)) {
    if (user.role !== "ADMIN") {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" as any },
        });
      } catch {}
    }
    return "ADMIN";
  }
  return user.role;
}

export class AuthService {
  async register(email: string, username: string, password: string) {
    if (isRetiredPassword(password)) throw Object.assign(new Error("請選擇未公開使用的密碼"), { statusCode: 400 });
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "使用者名稱";
      throw Object.assign(new Error(`${field}已被使用`), { statusCode: 409 });
    }

    const initialRole = AUTHORIZED_ADMIN_EMAILS.has(email.trim().toLowerCase()) ? "ADMIN" : "USER";
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: initialRole as any,
        isActive: true,
        avatarUrl: null,
        bio: null
      }
    });

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
    }

    const effectiveRole = await ensureAdminRoleIfAuthorized(user);
    const token = await issueSession(prisma, {
      userId: user.id,
      email: user.email,
      role: effectiveRole as any,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: effectiveRole,
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

    const effectiveRole = await ensureAdminRoleIfAuthorized(user);
    const token = await issueSession(prisma, {
      userId: user.id,
      email: user.email,
      role: effectiveRole as any,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: effectiveRole,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  async logout(token: string) {
    await revokeSession(prisma, token);
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Spirits: {
          where: { isActive: true },
          take: 10
        }
      }
    });

    if (!user) {
      throw Object.assign(new Error("使用者不存在"), { statusCode: 404 });
    }

    const effectiveRole = await ensureAdminRoleIfAuthorized(user);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: effectiveRole,
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
