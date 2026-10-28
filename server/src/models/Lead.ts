import mongoose, { Schema, Document } from "mongoose";

export interface ILead extends Document {
  applicationId: string;
  name: string;
  mobile: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: 18 | 22 | 24;
  schemeId: string;
  quote: Record<string, unknown>;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    applicationId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, index: true },
    grossWeightGrams: { type: Number, required: true },
    netWeightGrams: { type: Number, required: true },
    karat: { type: Number, enum: [18, 22, 24], required: true },
    schemeId: { type: String, required: true },
    quote: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      default: "SUBMITTED",
    },
  },
  { timestamps: true }
);

export const Lead = mongoose.model<ILead>("Lead", LeadSchema);
