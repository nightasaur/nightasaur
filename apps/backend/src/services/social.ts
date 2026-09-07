import axios from "axios";
import prisma from "../config/prisma.js";
import { config } from "../config/index.js";

export class SocialService {
  /**
   * 建立社群貼文（草稿或預約）
   */
  async createPost(params: {
    userId: string;
    spiritId?: string;
    content: string;
    imageUrl?: string;
    platform: string;
    scheduledAt?: Date;
  }) {
    const post = await prisma.socialPost.create({
      data: {
        userId: params.userId,
        spiritId: params.spiritId || null,
        content: params.content,
        imageUrl: params.imageUrl || null,
        platform: params.platform,
        status: params.scheduledAt ? "SCHEDULED" : "DRAFT",
        scheduledAt: params.scheduledAt || null,
      },
    });

    // 如果是立即發布，直接執行
    if (!params.scheduledAt) {
      await this.publishPost(post.id);
    }

    return post;
  }

  /**
   * 發布貼文到 FB / IG
   */
  async publishPost(postId: string) {
    const post = await prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post) throw Object.assign(new Error("貼文不存在"), { statusCode: 404 });

    try {
      let publishedPostId: string | null = null;

      if (post.platform === "FACEBOOK") {
        publishedPostId = await this.publishToFacebook(post.content, post.imageUrl);
      } else if (post.platform === "INSTAGRAM") {
        publishedPostId = await this.publishToInstagram(post.content, post.imageUrl);
      }

      await prisma.socialPost.update({
        where: { id: postId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          postId: publishedPostId,
        },
      });

      return { success: true, postId: publishedPostId };
    } catch (error: any) {
      await prisma.socialPost.update({
        where: { id: postId },
        data: { status: "FAILED" },
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
    return prisma.socialPost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * 取得所有貼文（管理員用）
   */
  async getAllPosts() {
    return prisma.socialPost.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { username: true } } },
    });
  }
}

export const socialService = new SocialService();
