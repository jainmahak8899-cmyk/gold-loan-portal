/**
 * API integration tests using supertest + mongodb-memory-server.
 * Tests: POST /quotes (math), POST /leads (201, 409, 422), GET /leads.
 */

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app";

// mongodb-memory-server may need to download the binary on first run — allow up to 120s
jest.setTimeout(120_000);

let mongod: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
}, 30_000);

afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ─── GET /api/v1/loan-schemes ─────────────────────────────────────────────────
describe("GET /api/v1/loan-schemes", () => {
  it("returns 200 with bullet and emi schemes", async () => {
    const res = await request(app).get("/api/v1/loan-schemes");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const ids = res.body.data.map((s: { id: string }) => s.id);
    expect(ids).toContain("bullet");
    expect(ids).toContain("emi");
    expect(res.body.goldRate24k).toBe(7000);
  });
});

// ─── POST /api/v1/quotes ──────────────────────────────────────────────────────
describe("POST /api/v1/quotes", () => {
  it("200 with correct math for 24K 10g EMI", async () => {
    const res = await request(app)
      .post("/api/v1/quotes")
      .send({ netWeightGrams: 10, karat: 24, schemeId: "emi" });
    expect(res.status).toBe(200);
    expect(res.body.data.eligibleLoan).toBe(52500);
    expect(res.body.data.goldValue).toBe(70000);
  });

  it("200 with correct math for 22K 10g Bullet (LTV 70%)", async () => {
    const res = await request(app)
      .post("/api/v1/quotes")
      .send({ netWeightGrams: 10, karat: 22, schemeId: "bullet" });
    expect(res.status).toBe(200);
    // pure = 9.1667g, goldValue = 64167, eligibleLoan = floor(64167 × 0.70) = 44916
    expect(res.body.data.effectiveLtv).toBe(0.70);
    expect(res.body.data.eligibleLoan).toBe(Math.floor(res.body.data.goldValue * 0.70));
  });

  it("422 for missing netWeightGrams", async () => {
    const res = await request(app)
      .post("/api/v1/quotes")
      .send({ karat: 22, schemeId: "emi" });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe("Validation failed");
  });

  it("422 for invalid karat (e.g. 20)", async () => {
    const res = await request(app)
      .post("/api/v1/quotes")
      .send({ netWeightGrams: 10, karat: 20, schemeId: "emi" });
    expect(res.status).toBe(422);
  });

  it("422 for netWeightGrams > 1000", async () => {
    const res = await request(app)
      .post("/api/v1/quotes")
      .send({ netWeightGrams: 1001, karat: 22, schemeId: "emi" });
    expect(res.status).toBe(422);
  });

  it("does not write to DB (pure calculation endpoint)", async () => {
    await request(app)
      .post("/api/v1/quotes")
      .send({ netWeightGrams: 10, karat: 24, schemeId: "emi" });
    const { Lead } = await import("../models/Lead");
    const count = await Lead.countDocuments();
    expect(count).toBe(0);
  });
});

// ─── POST /api/v1/leads ───────────────────────────────────────────────────────
const validLead = {
  name: "Priya Sharma",
  mobile: "9876543210",
  grossWeightGrams: 22,
  netWeightGrams: 20,
  karat: 22,
  schemeId: "emi",
};

describe("POST /api/v1/leads", () => {
  it("201 on valid submission with applicationId and masked mobile", async () => {
    const res = await request(app).post("/api/v1/leads").send(validLead);
    expect(res.status).toBe(201);
    expect(res.body.applicationId).toMatch(/^GL-\d{8}-[A-Z0-9]{4}$/);
    expect(res.body.mobile).toBe("9876XXXX10");
    expect(res.body.status).toBe("SUBMITTED");
    expect(res.body.quote.eligibleLoan).toBeGreaterThan(0);
  });

  it("201 recomputes quote server-side (ignores any client quote payload)", async () => {
    const res = await request(app)
      .post("/api/v1/leads")
      .send({ ...validLead, eligibleLoan: 9999999 }); // attacker tries to inject
    expect(res.status).toBe(201);
    // Server-computed value, not the injected one
    expect(res.body.quote.eligibleLoan).not.toBe(9999999);
  });

  it("409 Conflict for same mobile within 7 days", async () => {
    await request(app).post("/api/v1/leads").send(validLead);
    const res = await request(app).post("/api/v1/leads").send(validLead);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Duplicate application");
    expect(res.body.applicationId).toMatch(/^GL-/);
    expect(res.body.mobile).toBe("9876XXXX10");
  });

  it("422 for name too short (< 2 chars)", async () => {
    const res = await request(app)
      .post("/api/v1/leads")
      .send({ ...validLead, name: "A" });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe("Validation failed");
  });

  it("422 for invalid Indian mobile (starts with 5)", async () => {
    const res = await request(app)
      .post("/api/v1/leads")
      .send({ ...validLead, mobile: "5123456789" });
    expect(res.status).toBe(422);
  });

  it("422 for mobile with < 10 digits", async () => {
    const res = await request(app)
      .post("/api/v1/leads")
      .send({ ...validLead, mobile: "987654321" });
    expect(res.status).toBe(422);
  });

  it("422 when netWeight > grossWeight", async () => {
    const res = await request(app)
      .post("/api/v1/leads")
      .send({ ...validLead, netWeightGrams: 25, grossWeightGrams: 20 });
    expect(res.status).toBe(422);
    const fields = res.body.details?.map((d: { field: string }) => d.field);
    expect(fields).toContain("netWeightGrams");
  });

  it("422 for weight > 1000g", async () => {
    const res = await request(app)
      .post("/api/v1/leads")
      .send({ ...validLead, netWeightGrams: 1001, grossWeightGrams: 1001 });
    expect(res.status).toBe(422);
  });

  it("422 for invalid karat (e.g. 21)", async () => {
    const res = await request(app)
      .post("/api/v1/leads")
      .send({ ...validLead, karat: 21 });
    expect(res.status).toBe(422);
  });
});

// ─── GET /api/v1/leads ────────────────────────────────────────────────────────
describe("GET /api/v1/leads", () => {
  it("returns empty list when no leads", async () => {
    const res = await request(app).get("/api/v1/leads");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it("returns leads with masked mobiles only", async () => {
    await request(app).post("/api/v1/leads").send(validLead);
    const res = await request(app).get("/api/v1/leads");
    expect(res.status).toBe(200);
    expect(res.body.data[0].mobile).toBe("9876XXXX10");
    expect(res.body.data[0].mobile).not.toBe("9876543210");
  });

  it("returns leads newest first", async () => {
    await request(app).post("/api/v1/leads").send(validLead);
    await request(app)
      .post("/api/v1/leads")
      .send({ ...validLead, mobile: "8012345678" });
    const res = await request(app).get("/api/v1/leads");
    expect(res.status).toBe(200);
    const dates = res.body.data.map((l: { createdAt: string }) => new Date(l.createdAt).getTime());
    expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
  });

  it("filters by schemeId", async () => {
    await request(app).post("/api/v1/leads").send(validLead); // emi
    await request(app)
      .post("/api/v1/leads")
      .send({ ...validLead, mobile: "8012345678", schemeId: "bullet" });
    const res = await request(app).get("/api/v1/leads?schemeId=bullet");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].schemeId).toBe("bullet");
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────
describe("GET /health", () => {
  it("returns 200 ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
describe("404 handler", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/v1/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Route not found");
  });
});
