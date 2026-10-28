import { Router, Request, Response } from "express";
import { LOAN_SCHEMES } from "../config";

const router = Router();

/**
 * GET /api/v1/loan-schemes
 * Returns all active loan schemes
 */
router.get("/", (_req: Request, res: Response) => {
  const activeSchemes = LOAN_SCHEMES.filter((s) => s.active);
  res.json({ data: activeSchemes, goldRate24k: 7000 });
});

export default router;
