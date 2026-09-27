import axios from "axios";
import prisma from "../config/prisma.js";
import { config } from "../config/index.js";

const SOCIAL_CONTENT_PREFIX = "__NIGHTASAUR_SOCIAL_V1__:";

interface StoredSocialContent {
  content: string;
  platform: "FACEBOOK" | "INSTAGRAM";
  imageUrl?: string | null;
  externalPostId?: string | null;
}

function encodeSocialContent(value: StoredSocialContent): string {
  return `${SOCIAL_CONTENT_PREFIX}${JSON.stringify(value)}`;
}

function decodeSocialContent(value: string): StoredSocialContent | null {
  if (!value.startsWith(SOCIAL_CONTENT_PREFIX)) return null;

  try {
    return JSON.parse(value.slice(SOCIAL_CONTENT_PREFIX.length)) as StoredSocialContent;
  } catch {
    return null;
  }
}

function normalizePost<T extends { content: string }>(post: T) {
  const stored = decodeSocialContent(post.content);
  if (!stored) {
    return { ...post, platform: "UNKNOWN", imageUrl: null, postId: null };
  }

  return {
    ...post,
    content: stored.content,
    platform: stored.platform,
    imageUrl: stored.imageUrl || null,
    postId: stored.externalPostId || null,
  };
}

export class SocialService {
  /**
   * 建立社群貼文（草稿或預約）
   */
  async createPost(params: {
    userId: string;
    spiritId?: string;
    content: string;
    imageUrl?: string;
    platform: "FACEBOOK" | "INSTAGRAM";
    scheduledAt?: Date;
  }) {
    if (params.spiritId && !await prisma.spirit.findFirst({ where: {
      id: params.spiritId, userId: params.userId, isActive: true,
    } })) throw Object.assign(new Error("精靈不存在"), { statusCode: 404 });
    const post = await prisma.socialPost.create({
      data: {
        userId: params.userId,
        spiritId: params.spiritId || null,
        content: encodeSocialContent({
          content: params.content,
          platform: params.platform,
          imageUrl: params.imageUrl || null,
        }),
        status: params.scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: params.scheduledAt || null,
      },
    });

    // Creating a draft never sends content to the platform account.
    return normalizePost(post);
  }

  /**
   * 發布貼文到 FB / IG
   */
  async publishPost(postId: string, actorId: string) {
    if (!actorId) throw Object.assign(new Error("未登入"), { statusCode: 401 });
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!actor?.isActive || actor.role !== "ADMIN") {
      throw Object.assign(new Error("平台社群帳號僅限管理員發布"), { statusCode: 403 });
    }
    const post = await prisma.socialPost.findFirst({ where: { id: postId, userId: actorId } });
    if (!post) throw Object.assign(new Error("貼文不存在"), { statusCode: 404 });
    if (process.env.SOCIAL_PUBLISH_ENABLED !== "true") {
      throw Object.assign(new Error("社群發布尚未啟用"), { statusCode: 503 });
    }
    const stored = decodeSocialContent(post.content);
    if (!stored) {
      throw Object.assign(new Error("舊貼文缺少發布平台資訊，請重新建立貼文"), { statusCode: 400 });
    }

    if (!["FACEBOOK", "INSTAGRAM"].includes(stored.platform)) {
      throw Object.assign(new Error("不支援的發布平台"), { statusCode: 400 });
    }
    const claimed = await prisma.socialPost.updateMany({
      where: { id: postId, userId: actorId, status: { in: ["DRAFT", "SCHEDULED"] } },
      data: { status: "PUBLISHING" },
    });
    if (claimed.count !== 1) throw Object.assign(new Error("貼文已發布或待人工確認，禁止重送"), { statusCode: 409 });
    try {
      let publishedPostId: string | null = null;

      if (stored.platform === "FACEBOOK") {
        publishedPostId = await this.publishToFacebook(stored.content, stored.imageUrl);
      } else if (stored.platform === "INSTAGRAM") {
        publishedPostId = await this.publishToInstagram(stored.content, stored.imageUrl);
      }

      await prisma.socialPost.update({
        where: { id: postId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          content: encodeSocialContent({
            ...stored,
            externalPostId: publishedPostId,
          }),
        },
      });

      return { success: true, postId: publishedPostId };
    } catch (error: any) {
      await prisma.socialPost.update({
        where: { id: postId },
        // A timeout may follow acceptance by the platform. Never auto-retry.
        data: { status: "REVIEW_REQUIRED" },
      });
      throw error;
    }
  }

  /**
   * 發布到 Facebook 粉絲頁
   */
  private async publishToFacebook(content: string, imageUrl?: string | null): Promise<string> {
    const pageId = config.facebook.pageId;
    const accessToken = config.facebook.pageAccessToken;

    if (!pageId || !accessToken) {
      throw new Error("Facebook API 尚未設定，請設定 FACEBOOK_PAGE_ID 和 FACEBOOK_PAGE_ACCESS_TOKEN");
    }

    try {
      if (imageUrl) {
        // 圖文貼文
        const res = await axios.post(
          `https://graph.facebook.com/v19.0/${pageId}/photos`,
          {
            url: imageUrl,
            caption: content,
            access_token: accessToken,
          }
        );
        return res.data.id;
      } else {
        // 純文字貼文
        const res = await axios.post(
          `https://graph.facebook.com/v19.0/${pageId}/feed`,
          {
            message: content,
            access_token: accessToken,
          }
        );
        return res.data.id;
      }
    } catch (error: any) {
      console.error("[FB Publish Error]", error.response?.data || error.message);
      throw new Error(`Facebook 發布失敗: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 發布到 Instagram 商業帳號
   */
  private async publishToInstagram(content: string, imageUrl?: string | null): Promise<string> {
    const igAccountId = config.facebook.igBusinessAccountId;
    const accessToken = config.facebook.pageAccessToken;

    if (!igAccountId || !accessToken) {
      throw new Error("Instagram API 尚未設定，請設定 INSTAGRAM_BUSINESS_ACCOUNT_ID");
    }

    if (!imageUrl) {
      throw new Error("Instagram 需要提供圖片才能發布");
    }

    try {
      // Step 1: 建立媒體容器
      const createRes = await axios.post(
        `https://graph.facebook.com/v19.0/${igAccountId}/media`,
        {
          image_url: imageUrl,
          caption: content,
          access_token: accessToken,
        }
      );

      const creationId = createRes.data.id;

      // Step 2: 發布
      const publishRes = await axios.post(
        `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
        {
          creation_id: creationId,
          access_token: accessToken,
        }
      );

      return publishRes.data.id;
    } catch (error: any) {
      console.error("[IG Publish Error]", error.response?.data || error.message);
      throw new Error(`Instagram 發布失敗: ${error.response?.data?.error?.message || error.message}`);
    }

  }

  // 連線 API 用於測試
  async testFacebookConnection() {
    const { pageId, pageAccessToken } = config.facebook;
    if (!pageId || !pageAccessToken) {
      return { ok: false, error: "Facebook 粉絲頁設定不完整，請檢查 .env" };
    }
    try {
      const res = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
        params: { fields: "id,name,fan_count,followers_count", access_token: pageAccessToken },
      });
      return { ok: true, page: res.data };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error?.message || err.message };
    }
  }

  async testInstagramConnection() {
    const { igBusinessAccountId, pageAccessToken } = config.facebook;
    if (!igBusinessAccountId || !pageAccessToken) {
      return { ok: false, error: "Instagram 商業帳號設定不完整，請檢查 .env" };
    }
    try {
      const res = await axios.get(`https://graph.facebook.com/v19.0/${igBusinessAccountId}`, {
        params: { fields: "id,username,followers_count,media_count", access_token: pageAccessToken },
      });
      return { ok: true, account: res.data };
    } catch (err: any) {
      return { ok: false, error: err.response?.data?.error?.message || err.message };
    }
  }

  /**
   * 取得使用者貼文列表
   */
  async getUserPosts(userId: string) {
    const posts = await prisma.socialPost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return posts.map(normalizePost);
  }

  /**
   * 取得所有貼文（管理員用）
   */
  async getAllPosts() {
    const posts = await prisma.socialPost.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true } } },
    });
    return posts.map(normalizePost);
  }
}

export const socialService = new SocialService();
