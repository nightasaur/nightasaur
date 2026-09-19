import { Router } from "express";
import axios from "axios";
import { authMiddleware } from "../middleware/auth.js";
import { config } from "../config/index.js";
import { aiRequestOptions } from "../services/aiClient.js";

const router = Router();
router.use(authMiddleware);
// Fixed destinations only; never forward caller-supplied credentials or URLs.
for (const operation of ["chat", "code", "translate", "document"]) {
  router.post(`/${operation}`, async (req, res, next) => {
    try {
      const result = await axios.post(`${config.ai.engineUrl}/api/assistant/${operation}`,
        req.body, aiRequestOptions(60000));
      res.json(result.data);
    } catch {
      next(Object.assign(new Error("AI 服務暫時不可用"), { statusCode: 503 }));
    }
  });
}
export default router;
