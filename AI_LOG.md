# AI_LOG.md — Gold Loan Intake Portal

## 1. AI Tools Used

| Tool | What It Was Used For |
|------|----------------------|
| **Antigravity (Claude Sonnet)** | Scaffolding the full project structure, generating all TypeScript files (server + client), writing tests, and authoring this document |
| **OpenAI gpt-4o-mini** (runtime) | Powers the in-app AI Loan Assistant chat via the `/api/v1/agent/chat` endpoint. Uses tool-calling so the model **never does arithmetic itself** |

---

## 2. Exact Prompts

### Prompt A — Zod Validation Schema

> *Used to generate `server/src/schemas/leadSchema.ts`*

```
Write a Zod schema in TypeScript for validating a gold loan lead submission.
Rules:
- name: string, 2–60 chars, only letters/spaces/.-'
- mobile: string, exactly 10 digits, must start with 6, 7, 8, or 9 (Indian mobile)
- grossWeightGrams: positive number, max 1000
- netWeightGrams: positive number, max 1000
- karat: literal union of 18 | 22 | 24
- schemeId: non-empty string
- Cross-field: netWeightGrams must be ≤ grossWeightGrams (use .refine())
Export both the schema and its inferred TypeScript type.
```

### Prompt B — AI Agent Tool Definitions

> *Used to generate the tools array in `server/src/services/agentService.ts`*

```
Define three OpenAI function-calling tool definitions in TypeScript for a gold loan assistant:

1. get_loan_schemes — no parameters, returns loan plan details
2. calculate_quote — parameters: netWeightGrams (number), karat (18|22|24 enum),
   schemeId ("bullet"|"emi" enum). Must include a description that says
   "MUST be called for all numeric calculations — never compute yourself."
3. submit_application — parameters: confirmed (boolean, must be true),
   name, mobile, grossWeightGrams, netWeightGrams, karat, schemeId.
   Description must say it only runs after explicit user confirmation.

All tools should have clear descriptions that enforce: no LLM arithmetic,
confirmation gate before submission.
Use the OpenAI.Chat.ChatCompletionTool type.
```

---

## 3. One Place the AI Got It Wrong

### The Mistake — Incorrect EMI `totalRepayment` for Bullet Scheme

In the first version of `quoteService.ts`, the AI generated this code for the
`totalRepayment` field on the **bullet** scheme:

```typescript
// ❌ BUG: AI used EMI * 12 formula for bullet, but bullet has no EMI
totalRepayment = emi! * n;  // emi was null here → runtime crash / NaN
```

The AI wrote the `totalRepayment` assignment **inside** the `if (scheme.id === "emi")` block
and then tried to reference `emi` for bullet outside it. When `emi` was `null`,
`totalRepayment` became `NaN` — silently corrupting the response body.

### How I Spotted It

During a manual test of the bullet scheme:
```bash
curl -X POST http://localhost:3000/api/v1/quotes \
  -H "Content-Type: application/json" \
  -d '{"netWeightGrams":10,"karat":24,"schemeId":"bullet"}'
```

The response contained `"totalRepayment": null` instead of `₹58,800`
(`49,000 principal + 9,800 interest`). Checking the quoteService source
revealed `emi` was `null` for bullet and the repayment was never assigned
for that branch.

### The Fix

```typescript
// ✅ Correct: separate branches for each scheme type
if (scheme.id === "emi") {
  emi = Math.ceil((eligibleLoan * monthlyRate * Math.pow(1 + monthlyRate, n))
        / (Math.pow(1 + monthlyRate, n) - 1));
  totalRepayment = emi * n;
  totalInterest = totalRepayment - eligibleLoan;
} else {
  // Bullet: simple annual interest, no EMI
  totalInterest = Math.round(eligibleLoan * (scheme.interestRatePA / 100));
  totalRepayment = eligibleLoan + totalInterest;
}
```

### The Test That Now Catches It

In `server/src/__tests__/quoteService.test.ts`:

```typescript
it("Bullet scheme returns null EMI", () => {
  const q = computeQuote({ netWeightGrams: 10, karat: 24, schemeId: "bullet" });
  expect(q.emi).toBeNull();
});

it("totalRepayment equals eligibleLoan + totalInterest", () => {
  const q = computeQuote({ netWeightGrams: 10, karat: 24, schemeId: "emi" });
  expect(q.totalRepayment).toBe(q.eligibleLoan + q.totalInterest);
});
```

And in `api.test.ts`:
```typescript
it("200 with correct math for 24K 10g EMI", async () => {
  const res = await request(app)
    .post("/api/v1/quotes")
    .send({ netWeightGrams: 10, karat: 24, schemeId: "emi" });
  expect(res.body.data.eligibleLoan).toBe(52500);
  expect(res.body.data.goldValue).toBe(70000);
});
```

Running `npm test` in the `server/` workspace will flag any regression in the math immediately.
