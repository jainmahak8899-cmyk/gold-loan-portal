import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { runAgentChat, ChatMessage } from "../services/agentService";

const router = Router();

const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(2000),
    })
  ).min(1).max(50),
});

/**
 * POST /api/v1/agent/chat
 * Body: { messages: [{role, content}] }
 */
router.post("/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        error: "Validation failed",
        details: parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }

    const reply = await runAgentChat(parsed.data.messages as ChatMessage[]);
    res.json({ reply });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message?.includes("OPENAI_API_KEY")) {
      res.status(503).json({
        error: "AI assistant not configured",
        message: error.message,
      });
      return;
    }
    next(err);
  }
});

export default router;
