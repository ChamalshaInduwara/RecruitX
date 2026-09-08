import { rateLimit } from "express-rate-limit";

/*
|--------------------------------------------------------------------------
| Login Rate Limiter
|--------------------------------------------------------------------------
| Protects the login endpoint against repeated password attempts.
|--------------------------------------------------------------------------
*/

export const loginRateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 10,

    standardHeaders: true,
    legacyHeaders: false,

    skipSuccessfulRequests: true,

    message: {
      status: "error",
      message:
        "Too many login attempts. Please try again later.",
    },
  });