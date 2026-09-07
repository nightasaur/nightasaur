import { Request, Response, NextFunction } from "express";
import { dialogueService } from "../services/ai.js";
import { socialService } from "../services/social.js";
import { dialogueSchema, socialPostSchema } from "../utils/validators.js";
import prisma from "../config/prisma.js";

export class DialogueController {
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const data = dialogueSchema.parse(req.body);
      const reply = await dialogueService.chat(data.spiritId, req.user!.userId, data.message);
      res.json(reply);
    } catch (err) {
      next(err);
    }
  }
}

export class SocialController {
  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const data = socialPostSchema.parse(req.body);
      const post = await socialService.createPost({
        userId: req.user!.userId,
        spiritId: data.spiritId,
        content: data.content,
        imageUrl: data.imageUrl,
        platform: data.platform,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      });
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }

  async publishPost(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await socialService.publishPost(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getUserPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await socialService.getUserPosts(req.user!.userId);
      res.json(posts);
    } catch (err) {
      next(err);
    }
  }

  async getAllPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await socialService.getAllPosts();
      res.json(posts);
    } catch (err) {
      next(err);
    }
  }

  async testFBConnection(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await socialService.testFacebookConnection();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async testIGConnection(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await socialService.testInstagramConnection();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export class GenerationController {
  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await prisma.generationTask.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  }
}

export const dialogueController = new DialogueController();
export const socialController = new SocialController();
export const generationController = new GenerationController();
