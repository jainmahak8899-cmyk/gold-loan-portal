import OpenAI from "openai";
import { CONFIG, LOAN_SCHEMES, GOLD_RATE_24K } from "../config";
import { computeQuote, maskMobile, generateApplicationId } from "./quoteService";
import { Lead } from "../models/Lead";
import { LeadRequestSchema } from "../schemas/leadSchema";

const SYSTEM_PROMPT = `You are a friendly and helpful Gold Loan Assistant for a lending company.
Your job is to help customers understand gold loan options, estimate loan amounts, and assist with applications.

CRITICAL RULES (must follow always):
1. NEVER do arithmetic yourself. Always call calculate_quote for ANY numeric calculations.
2. Only call submit_application when the user explicitly confirms with words like "yes", "confirm", "submit", "go ahead", or "proceed".
3. Always display numbers from tool results — never invent or estimate numbers.
4. Be warm, professional, and use simple language. Avoid financial jargon.
5. Ask for details step by step: name → mobile → gold weight → karat → scheme preference.
6. After showing a quote, always ask the user to confirm before submitting.
7. If the user hasn't provided all required info, ask for missing details before calculating.
8. Format currency amounts with ₹ symbol and use Indian number formatting where possible.`;

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_loan_schemes",
      description:
        "Retrieve all available gold loan schemes with interest rates, LTV ratios, and tenure. Call this when the user asks about loan options or plans.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_quote",
      description:
        "Calculate the eligible loan amount and repayment details for given gold details. MUST be called for all numeric calculations — never compute yourself.",
      parameters: {
        type: "object",
        properties: {
          netWeightGrams: {
            type: "number",
            description: "Net weight of gold in grams (after deducting stone/metal weight)",
          },
          karat: {
            type: "number",
            enum: [18, 22, 24],
            description: "Gold purity in karats",
          },
          schemeId: {
            type: "string",
            enum: ["bullet", "emi"],
            description: "Loan scheme: bullet (lump-sum repayment) or emi (monthly installments)",
          },
        },
        required: ["netWeightGrams", "karat", "schemeId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_application",
      description:
        "Submit a loan application. ONLY call after user explicitly confirms. Requires all borrower details.",
      parameters: {
        type: "object",
        properties: {
          confirmed: {
            type: "boolean",
            description: "Must be true — user has explicitly confirmed submission",
          },
          name: { type: "string", description: "Full name of the borrower" },
          mobile: { type: "string", description: "10-digit Indian mobile number" },
          grossWeightGrams: {
            type: "number",
            description: "Gross weight of gold including any non-gold components",
          },
          netWeightGrams: { type: "number", description: "Net pure gold weight in grams" },
          karat: { type: "number", enum: [18, 22, 24] },
          schemeId: { type: "string", enum: ["bullet", "emi"] },
        },
        required: [
          "confirmed",
          "name",
          "mobile",
          "grossWeightGrams",
          "netWeightGrams",
          "karat",
          "schemeId",
        ],
      },
    },
  },
];

async function executeToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  if (name === "get_loan_schemes") {
    return JSON.stringify({
      schemes: LOAN_SCHEMES,
      goldRate24k: GOLD_RATE_24K,
    });
  }

  if (name === "calculate_quote") {
    const { netWeightGrams, karat, schemeId } = args as {
      netWeightGrams: number;
      karat: 18 | 22 | 24;
      schemeId: string;
    };
    const quote = computeQuote({ netWeightGrams, karat, schemeId });
    return JSON.stringify(quote);
  }

  if (name === "submit_application") {
    const typedArgs = args as {
      confirmed: boolean;
      name: string;
      mobile: string;
      grossWeightGrams: number;
      netWeightGrams: number;
      karat: 18 | 22 | 24;
      schemeId: string;
    };

    if (!typedArgs.confirmed) {
      return JSON.stringify({ error: "User has not confirmed. Do not submit." });
    }

    const parsed = LeadRequestSchema.safeParse({
      name: typedArgs.name,
      mobile: typedArgs.mobile,
      grossWeightGrams: typedArgs.grossWeightGrams,
      netWeightGrams: typedArgs.netWeightGrams,
      karat: typedArgs.karat,
      schemeId: typedArgs.schemeId,
    });

    if (!parsed.success) {
      return JSON.stringify({
        error: "Validation failed",
        details: parsed.error.errors.map((e) => e.message).join(", "),
      });
    }

    // Duplicate check
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const existing = await Lead.findOne({
      mobile: typedArgs.mobile,
      createdAt: { $gte: sevenDaysAgo },
    });

    if (existing) {
      return JSON.stringify({
        error: "Duplicate application",
        applicationId: existing.applicationId,
        mobile: maskMobile(typedArgs.mobile),
        message: "An application already exists for this number in the last 7 days.",
      });
    }

    const quote = computeQuote({
      netWeightGrams: typedArgs.netWeightGrams,
      karat: typedArgs.karat,
      schemeId: typedArgs.schemeId,
    });

    const applicationId = generateApplicationId();
    await Lead.create({
      applicationId,
      name: typedArgs.name.trim(),
      mobile: typedArgs.mobile,
      grossWeightGrams: typedArgs.grossWeightGrams,
      netWeightGrams: typedArgs.netWeightGrams,
      karat: typedArgs.karat,
      schemeId: typedArgs.schemeId,
      quote,
      status: "SUBMITTED",
    });

    return JSON.stringify({
      success: true,
      applicationId,
      mobile: maskMobile(typedArgs.mobile),
      eligibleLoan: quote.eligibleLoan,
      schemeName: quote.schemeName,
    });
  }

  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function runAgentChat(messages: ChatMessage[]): Promise<string> {
  if (!CONFIG.OPENAI_API_KEY) {
    throw new Error(
      "AI assistant is not configured. Please set OPENAI_API_KEY in your environment."
    );
  }

  const client = new OpenAI({ apiKey: CONFIG.OPENAI_API_KEY });

  const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam)),
  ];

  // Agentic loop with tool calling
  let iterations = 0;
  const MAX_ITERATIONS = 10;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    const response = await client.chat.completions.create({
      model: CONFIG.OPENAI_MODEL,
      messages: conversationMessages,
      tools,
      tool_choice: "auto",
      temperature: 0.3,
    });

    const choice = response.choices[0];
    const message = choice.message;

    if (choice.finish_reason === "stop" || !message.tool_calls?.length) {
      return message.content || "I'm sorry, I couldn't generate a response.";
    }

    // Process tool calls
    conversationMessages.push(message);

    for (const toolCall of message.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
      const result = await executeToolCall(toolCall.function.name, args);
      conversationMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  return "I'm having trouble processing your request. Please try again.";
}
