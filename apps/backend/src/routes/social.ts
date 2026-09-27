import { Router } from "express";
import { dialogueController, socialController, generationController } from "../controllers/social.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

router.post("/", (req, res, next) => dialogueController.chat(req, res, next));

const socialRouter = Router({ mergeParams: true });
socialRouter.use(authMiddleware);

socialRouter.post("/", (req, res, next) => socialController.createPost(req, res, next));

socialRouter.post("/:id/publish", adminMiddleware, (req, res, next) => socialController.publishPost(req, res, next));

socialRouter.get("/", (req, res, next) => socialController.getUserPosts(req, res, next));

socialRouter.get("/admin/posts", adminMiddleware, (req, res, next) => socialController.getAllPosts(req, res, next));

socialRouter.get("/test/fb", adminMiddleware, (req, res, next) => socialController.testFBConnection(req, res, next));

socialRouter.get("/test/ig", adminMiddleware, (req, res, next) => socialController.testIGConnection(req, res, next));

router.get("/tasks", (req, res, next) => generationController.getTasks(req, res, next));

export { router as dialogueRouter, socialRouter };
