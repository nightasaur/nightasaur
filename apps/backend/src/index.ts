import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { scheduler } from "./jobs/scheduler.js";
import authRoutes from "./routes/auth.js";
import spiritRoutes from "./routes/spirits.js";
import { dialogueRouter, socialRouter } from "./routes/social.js";
import generateRoutes from "./routes/generate.js";
import gameRoutes from "./routes/game.js";
import puzzleRoutes from "./routes/puzzle.js";
import gameLogicRoutes from "./routes/gameLogic.js";
import squadRoutes from "./routes/squad.js";
import arLocationRoutes from "./routes/arLocation.js";
import languageRoutes from "./routes/language.js";
import battleRoutes from "./routes/battle.js";

const app = express();

// 中間件配置
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 健康檢查路由
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Nightasaur Backend",
    version: "1.0.0",
  });
});

// API 路由配置
app.use("/api/auth", authRoutes);
app.use("/api/spirits", spiritRoutes);
app.use("/api/dialogue", dialogueRouter);
app.use("/api/social/posts", socialRouter);
app.use("/api/generate", generateRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/puzzles", puzzleRoutes);
app.use("/api/game-logic", gameLogicRoutes);
app.use("/api/squads", squadRoutes);
app.use("/api/ar", arLocationRoutes);
app.use("/api/language", languageRoutes);
app.use("/api/battle", battleRoutes);

// 錯誤處理中間件
app.use(errorHandler);

// 啟動伺服器
app.listen(config.port, () => {
  scheduler.start();
  console.log(`
┌─────────────────────────────────────────┐
│       🦖 Nightasaur Backend 🦖         │
│       智慧精靈平台                      │
├─────────────────────────────────────────┤
│ Server : http://localhost:${config.port}       │
│ API    : http://localhost:${config.port}/api   │
│ Env    : ${config.nodeEnv.padEnd(20)}│
└─────────────────────────────────────────┘
  `);
});

export default app;
