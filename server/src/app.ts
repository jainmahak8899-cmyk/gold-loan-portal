import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";

import loanSchemesRouter from "./routes/loanSchemes";
import quotesRouter from "./routes/quotes";
import leadsRouter from "./routes/leads";
import agentRouter from "./routes/agent";

export function createApp() {
  const app = express();

  app.use(cors({ origin: "*" }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1/loan-schemes", loanSchemesRouter);
  app.use("/api/v1/quotes", quotesRouter);
  app.use("/api/v1/leads", leadsRouter);
  app.use("/api/v1/agent", agentRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use(errorHandler);

  return app;
}
