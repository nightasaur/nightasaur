import { Request, Response, NextFunction } from "express";
import { englishTrainingService } from "../services/englishTraining.js";

export class EnglishTrainingController {
  // 取得所有主題
  async getTopics(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, difficulty } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "未授權" });
      }

      const topics = await englishTrainingService.getTopics(
        category as string,
        difficulty as string
      );

      res.json({ topics });
    } catch (error: any) {
      next(error);
    }
  }

  // 取得單個主題
  async getTopicById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "未授權" });
      }

      const topics = await englishTrainingService.getTopics();
      const topic = topics.find(t => t.id === id);

      if (!topic) {
        return res.status(404).json({ error: "主題不存在" });
      }

      res.json({ topic });
    } catch (error: any) {
      next(error);
    }
  }

  // 開始對話
  async startConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { spiritId, topicId } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "未授權" });
      }

      if (!topicId) {
        return res.status(400).json({ error: "請選擇主題" });
      }

      const result = await englishTrainingService.startConversation(
        userId,
        spiritId,
        topicId
      );

      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }

  // 進行對話
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { spiritId, topicId, message, userLocale } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "未授權" });
      }

      if (!topicId || !message?.trim()) {
        return res.status(400).json({ error: "請輸入訊息並選擇主題" });
      }

      const result = await englishTrainingService.chat(
        userId,
        {
          topicId,
          message: message.trim(),
          spiritId,
          userLocale: userLocale || 'zh-TW'
        }
      );

      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }

  // 取得對話歷史
  async getConversationHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { topicId, limit } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: "未授權" });
      }

      const history = await englishTrainingService.getConversationHistory(
        userId,
        topicId as string,
        limit ? parseInt(limit as string) : 20
      );

      res.json({ history });
    } catch (error: any) {
      next(error);
    }
  }
}