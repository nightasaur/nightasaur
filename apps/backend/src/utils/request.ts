import type { Request } from "express";

/** Return one named route parameter and reject wildcard/array-shaped input. */
export function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || !value) {
    throw Object.assign(new Error(`Invalid route parameter: ${name}`), { statusCode: 400 });
  }
  return value;
}
