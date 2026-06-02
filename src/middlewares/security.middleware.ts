import { NextFunction, Request, RequestHandler, Response } from "express";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  );

  next();
};

export const createRateLimiter = ({
  windowMs,
  maxRequests,
}: RateLimitOptions): RequestHandler => {
  const buckets = new Map<string, RateLimitRecord>();

  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const now = Date.now();
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${clientIp}:${req.path}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;

    if (current.count > maxRequests) {
      res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000).toString());

      return res.status(429).json({
        success: false,
        statusCode: 429,
        error: "Too Many Requests",
        message: "Too many requests. Please try again later.",
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.path,
      });
    }

    next();
  };
};
