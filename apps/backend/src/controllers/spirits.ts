import { Request, Response, NextFunction } from "express";
import { spiritService } from "../services/spirit.js";
import { memoryService } from "../services/spirit/MemoryService.js";
import { createSpiritSchema, customizeSpiritSchema } from "../utils/validators.js";
import { routeParam } from "../utils/request.js";

export class SpiritController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSpiritSchema.parse(req.body);
      const spirit = await spiritService.createSpirit({
        userId: req.user!.userId,
        name: data.name,
        element: data.element,
        personality: data.personality,
        appearance: data.appearance,
        species: data.species,
      });
      res.status(201).json(spirit);
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const spirits = await spiritService.getUserSpirits(req.user!.userId);
      res.json(spirits);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const spirit = await spiritService.getSpiritById(routeParam(req, "id"), req.user!.userId);
      res.json(spirit);
    } catch (err) {
      next(err);
    }
  }

  async evolve(req: Request, res: Response, next: NextFunction) {
    try {
      const spirit = await spiritService.evolveSpirit(routeParam(req, "id"), req.user!.userId);
      res.json(spirit);
    } catch (err) {
      next(err);
    }
  }

  async rename(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const spirit = await spiritService.renameSpirit(routeParam(req, "id"), req.user!.userId, name);
      res.json(spirit);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await spiritService.deleteSpirit(routeParam(req, "id"), req.user!.userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
async customize(req: Request, res: Response, next: NextFunction) {
    try {
      const data = customizeSpiritSchema.parse(req.body);
      const spirit = await spiritService.customizeSpirit(routeParam(req, "id"), req.user!.userId, data);
      res.json(spirit);
    } catch (err) {
      next(err);
    }
  }

  async listMemories(req: Request, res: Response, next: NextFunction) {
    try {
      const id = routeParam(req, "id");
      const limitRaw = parseInt((req.query.limit as string) || "50", 10);
      const limit = Math.min(Math.max(limitRaw || 50, 1), 200);
      const memories = await memoryService.listForUser(id, req.user!.userId, limit);
      res.json({ memories, count: memories.length });
    } catch (err) {
      next(err);
    }
  }

  async deleteMemory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = routeParam(req, "id");
      const memoryId = routeParam(req, "memoryId");
      const ok = await memoryService.deleteById(id, req.user!.userId, memoryId);
      if (!ok) {
        res.status(404).json({ error: "Memory not found" });
        return;
      }
      res.json({ success: true, deletedId: memoryId });
    } catch (err) {
      next(err);
    }
  }
}

export const spiritController = new SpiritController();
