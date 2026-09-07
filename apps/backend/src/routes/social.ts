import { Router } from "express";
import { dialogueController, socialController, generationController } from "../controllers/social.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.ts";

const router = Router();
router.use(authMiddleware);

// ?€?€?€ å°è©± ?€?€?€
// POST /api/dialogue - ?‡ç²¾?ˆå?è©?
router.post("/", (req, res, next) => dialogueController.chat(req, res, next));

// ?€?€?€ ç¤¾ç¾¤?¼æ? ?€?€?€
const socialRouter = Router({ mergeParams: true });

// POST /api/social/posts - å»ºç?è²¼æ?ï¼ˆè?ç¨??’ç?ï¼?
socialRouter.post("/", (req, res, next) => socialController.createPost(req, res, next));

// POST /api/social/posts/:id/publish - ?¼å?
socialRouter.post("/:id/publish", (req, res, next) => socialController.publishPost(req, res, next));

// GET /api/social/posts - ?‘ç?è²¼æ?
socialRouter.get("/", (req, res, next) => socialController.getUserPosts(req, res, next));

// GET /api/social/admin/posts - ?¨éƒ¨è²¼æ?ï¼ˆç®¡?†å“¡ï¼?
socialRouter.get("/admin/posts", adminMiddleware, (req, res, next) => socialController.getAllPosts(req, res, next));

// GET /api/social/test/fb - æ¸¬è©¦ Facebook API ???
socialRouter.get("/test/fb", (req, res, next) => socialController.testFBConnection(req, res, next));

// GET /api/social/test/ig - æ¸¬è©¦ Instagram API ???
socialRouter.get("/test/ig", (req, res, next) => socialController.testIGConnection(req, res, next));

// ?€?€?€ ?Ÿæ?ä»»å??€???€?€?€
// GET /api/tasks - ?‘ç??Ÿæ?ä»»å?
router.get("/tasks", (req, res, next) => generationController.getTasks(req, res, next));

export { router as dialogueRouter, socialRouter };
