import { Request, Response, NextFunction } from "express";
import { spiritService } from "../services/spirit.js";
import { createSpiritSchema, customizeSpiritSchema } from "../utils/validators.js";

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
      const spirit = await spiritService.getSpiritById(req.params.id);
      res.json(spirit);
    } catch (err) {
      next(err);
    }
  }

  async evolve(req: Request, res: Response, next: NextFunction) {
    try {
      const spirit = await spiritService.evolveSpirit(req.params.id, req.user!.userId);
      res.json(spirit);
    } catch (err) {
      next(err);
    }
  }

  async rename(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const spirit = await spiritService.renameSpirit(req.params.id, req.user!.userId, name);
      res.json(spirit);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await spiritService.deleteSpirit(req.params.id, req.user!.userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
async customize(req: Request, res: Response, next: NextFunction) {
    try {
      const data = customizeSpiritSchema.parse(req.body);
      const spirit = await spiritService.customizeSpirit(req.params.id, req.user!.userId, data);
      res.json(spirit);
    } catch (err) {
      next(err);
    }
  }
}

export const spiritController = new SpiritController();
