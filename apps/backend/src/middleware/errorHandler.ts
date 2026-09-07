import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(`[Error] ${err.message}`, err.stack);

  // Zod 驗�??�誤
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "輸入資�??��??�誤",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // 一?�錯�?
  const statusCode = (err as any).statusCode || 500;
  res.status(statusCode).json({
    error: err.message || "伺服器內部錯誤",
  });
}
