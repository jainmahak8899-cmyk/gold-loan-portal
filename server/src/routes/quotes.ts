import { Router, Request, Response, NextFunction } from "express";
import { QuoteRequestSchema } from "../schemas/leadSchema";
import { computeQuote } from "../services/quoteService";
import { ZodError } from "zod";

const router = Router();

/**
 * POST /api/v1/quotes
 * Pure calculation endpoint — no DB write.
 * Body: { netWeightGrams, karat, schemeId }
 */
router.post("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    // .parse() throws ZodError on failure → caught by errorHandler
    // and returns a definite typed value (not T | undefined) on success
    const data = QuoteRequestSchema.parse(req.body);
    const quote = computeQuote({
      netWeightGrams: data.netWeightGrams,
      karat: data.karat,
      schemeId: data.schemeId,
    });
    res.json({ data: quote });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({
        error: "Validation failed",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }
    next(err);
  }
});

export default router;
