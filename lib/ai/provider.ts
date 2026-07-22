import "server-only";

import type { BlogGenerationInput } from "@/lib/validation/blog-generation";

export type AiDraftResult = { text: string; provider: string; model: string; metadata: Record<string, unknown> };

export interface AiProvider {
  generateBlogDraft(input: BlogGenerationInput, context: { companyName: string; serviceArea: string }): Promise<AiDraftResult>;
}

class HttpAiProvider implements AiProvider {
  constructor(private readonly endpoint: string, private readonly apiKey: string, private readonly model: string) {}

  async generateBlogDraft(input: BlogGenerationInput, context: { companyName: string; serviceArea: string }): Promise<AiDraftResult> {
    const system = "Draft a useful painting-company article using only the supplied first-party facts. Do not invent projects, testimonials, neighborhoods, credentials, prices, ratings, experience, products, or outcomes. Mark unsupported gaps for reviewer attention. Return plain Markdown. Never imply publication approval.";
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, system, input: { company: context.companyName, serviceArea: context.serviceArea, ...input } }),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}.`);
    const payload = await response.json() as { text?: unknown; model?: unknown; metadata?: unknown };
    if (typeof payload.text !== "string" || payload.text.trim().length < 100) throw new Error("AI provider returned an invalid draft.");
    return { text: payload.text, provider: new URL(this.endpoint).hostname, model: typeof payload.model === "string" ? payload.model : this.model, metadata: typeof payload.metadata === "object" && payload.metadata ? payload.metadata as Record<string, unknown> : {} };
  }
}

export function getAiProvider(): AiProvider | null {
  const endpoint = process.env.AI_PROVIDER_ENDPOINT;
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  const model = process.env.AI_PROVIDER_MODEL;
  return endpoint && apiKey && model ? new HttpAiProvider(endpoint, apiKey, model) : null;
}
