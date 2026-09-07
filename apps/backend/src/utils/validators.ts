import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("è«‹è¼¸?¥æ??ˆç? Email"),
  username: z.string().min(3, "ä½¿ç”¨?…å?ç¨±è‡³å°?3 ?‹å?").max(30),
  password: z.string().min(8, "å¯†ç¢¼?³å? 8 ?‹å?"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createSpiritSchema = z.object({
  name: z.string().min(2).max(20),
  element: z.enum(["FIRE", "WATER", "LIGHT", "SHADOW", "STAR", "ILLUSION", "MOON", "NATURE", "THUNDER", "ICE"]),
  personality: z.string().optional(),
  appearance: z.string().optional(),
  species: z.string().optional(),
});

export const customizeSpiritSchema = z.object({
  customization: z.any().optional(),
  name: z.string().min(2).max(20).optional(),
});

export const dialogueSchema = z.object({
  spiritId: z.string().min(1),
  message: z.string().min(1).max(500),
});

export const socialPostSchema = z.object({
  spiritId: z.string().optional(),
  content: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional(),
  platform: z.enum(["FACEBOOK", "INSTAGRAM"]),
  scheduledAt: z.string().datetime().optional(),
});
