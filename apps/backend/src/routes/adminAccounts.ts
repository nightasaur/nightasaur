import { Router } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import {
  listAccounts,
  changeAccount,
  accountHistory,
} from "../services/accountAdmin.js";
const router = Router();
router.use(authMiddleware, adminMiddleware);
router.get("/", async (req, res) => {
  res.json(await listAccounts(req.query));
});
router.get("/:id/history", async (req, res) => {
  res.json(await accountHistory(String(req.params.id)));
});
router.post("/:id/actions", async (req, res) => {
  res.json(
    await changeAccount(req.user!.userId, String(req.params.id), req.body),
  );
});
router.delete("/:id", (_req, res) => {
  res.status(405).json({ error: "帳號僅可封禁或復原，禁止永久刪除" });
});
export default router;
