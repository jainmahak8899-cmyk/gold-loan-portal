import { Router, Request, Response, NextFunction } from "express";
import { LeadRequestSchema } from "../schemas/leadSchema";
import { computeQuote, maskMobile, generateApplicationId } from "../services/quoteService";
import { Lead } from "../models/Lead";
import { ZodError } from "zod";

const router = Router();

/**
 * POST /api/v1/leads
 * Validates, deduplicates, computes quote server-side, and stores the lead.
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    let data: ReturnType<typeof LeadRequestSchema.parse>;
    try {
      data = LeadRequestSchema.parse(req.body);
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
      throw err;
    }

    const { name, mobile, grossWeightGrams, netWeightGrams, karat, schemeId } = data;

    // Duplicate check: same mobile within last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const existing = await Lead.findOne({
      mobile,
      createdAt: { $gte: sevenDaysAgo },
    }).sort({ createdAt: -1 });

    if (existing) {
      res.status(409).json({
        error: "Duplicate application",
        message: `An application already exists for this mobile number. Please check back or contact support.`,
        applicationId: existing.applicationId,
        mobile: maskMobile(mobile),
      });
      return;
    }

    // Server-side quote recomputation
    const quote = computeQuote({ netWeightGrams, karat, schemeId });

    const applicationId = generateApplicationId();

    const lead = await Lead.create({
      applicationId,
      name: name.trim(),
      mobile,
      grossWeightGrams,
      netWeightGrams,
      karat,
      schemeId,
      quote,
      status: "SUBMITTED",
    });

    res.status(201).json({
      applicationId: lead.applicationId,
      name: lead.name,
      mobile: maskMobile(mobile),
      schemeId: lead.schemeId,
      quote,
      status: lead.status,
      createdAt: lead.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/leads
 * Returns all leads sorted newest first with masked mobiles.
 * Query: schemeId, status, page, limit
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schemeId, status, page = "1", limit = "20" } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (schemeId) filter.schemeId = schemeId;
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Lead.countDocuments(filter),
    ]);

    const maskedLeads = leads.map((l) => ({
      ...l,
      mobile: maskMobile(l.mobile),
    }));

    res.json({
      data: maskedLeads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
