import { z } from "zod";

export const QuoteRequestSchema = z.object({
  netWeightGrams: z
    .number({ required_error: "Net weight is required" })
    .positive("Net weight must be positive")
    .max(1000, "Net weight cannot exceed 1000g"),
  karat: z.union([z.literal(18), z.literal(22), z.literal(24)], {
    errorMap: () => ({ message: "Karat must be 18, 22, or 24" }),
  }),
  schemeId: z.string().min(1, "Scheme is required"),
});

export const LeadRequestSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .regex(/^[a-zA-Z\s.'-]+$/, "Name can only contain letters, spaces, and . ' -"),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile starting with 6-9"),
  grossWeightGrams: z
    .number({ required_error: "Gross weight is required" })
    .positive("Gross weight must be positive")
    .max(1000, "Gross weight cannot exceed 1000g"),
  netWeightGrams: z
    .number({ required_error: "Net weight is required" })
    .positive("Net weight must be positive")
    .max(1000, "Net weight cannot exceed 1000g"),
  karat: z.union([z.literal(18), z.literal(22), z.literal(24)], {
    errorMap: () => ({ message: "Karat must be 18, 22, or 24" }),
  }),
  schemeId: z.string().min(1, "Scheme is required"),
}).refine(
  (data) => data.netWeightGrams <= data.grossWeightGrams,
  {
    message: "Net weight cannot exceed gross weight",
    path: ["netWeightGrams"],
  }
);

export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;
export type LeadRequest = z.infer<typeof LeadRequestSchema>;
