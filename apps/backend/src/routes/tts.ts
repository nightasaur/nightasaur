import { Router } from "express";
import axios from "axios";

const router = Router();

const PIPER_URL = process.env.PIPER_URL || "http://host.docker.internal:5000";

router.post("/", async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }

    const piperResponse = await axios.get(`${PIPER_URL}/`, {
      params: { text: text.slice(0, 500) },
      responseType: "arraybuffer",
      timeout: 30000,
    });

    res.set("Content-Type", "audio/wav");
    res.set("Cache-Control", "no-cache");
    res.send(Buffer.from(piperResponse.data));

  } catch (error: any) {
    console.error("Piper TTS error:", error.message);
    res.status(500).json({ error: "TTS failed: " + error.message });
  }
});

export default router;