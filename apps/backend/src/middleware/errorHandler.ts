import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(`[Error] ${err.message}`, err.stack);

  // Zod 驗證錯誤
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "輸入資料驗證錯誤",
      details: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // 檢查是否已經是結構化錯誤
  const errorObj = err as any;
  if (errorObj.success !== undefined) {
    res.status(errorObj.statusCode || 500).json({
      success: errorObj.success,
      message: errorObj.message || "請求處理失敗",
      details: errorObj.details,
      statusCode: errorObj.statusCode || 500,
    });
    return;
  }

  // 一般錯誤
  const statusCode = errorObj.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "伺服器內部錯誤",
    statusCode: statusCode,
  });
}
