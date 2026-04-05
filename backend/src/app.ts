import express, { Router } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { Config } from "./config.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { healthRouter } from "./routes/health.js";
import { createAuthRouter } from "./routes/auth.js";
import { createPasswordResetRouter } from "./routes/passwordReset.js";
import { createMeAccountRouter } from "./routes/meAccount.js";
import { createMeInboxRouter } from "./routes/meInbox.js";

export function buildApp(config: Config) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());

  app.use(
    helmet({
      contentSecurityPolicy: config.NODE_ENV === "production",
    }),
  );

  const origins = config.CORS_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: origins.length ? origins : false,
      credentials: true,
    }),
  );

  app.use(
    rateLimit({
      windowMs: 60_000,
      max: config.NODE_ENV === "production" ? 200 : 2000,
    }),
  );

  app.use("/api", healthRouter);
  app.use("/api/auth", createAuthRouter(config));
  app.use("/api/auth", createPasswordResetRouter(config));

  const meRouter = Router();
  meRouter.use(createMeInboxRouter());
  meRouter.use(createMeAccountRouter(config));
  app.use("/api/me", requireAuth(config), meRouter);

  return app;
}
