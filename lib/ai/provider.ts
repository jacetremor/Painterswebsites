import "server-only";

import type { BlogGenerationInput } from "@/lib/validation/blog-generation";
import { z } from "zod";

export type AiDraftResult = { text: string; provider: string; model: string; metadata: Record<string, unknown> };

export type SourceFact = { id: string; field: string; value: unknown };
export type WebsiteDraftInput = { entityType: "page" | "project" | "faq" | "image_alt" | "blog"; entityKey: string; sourceFacts: SourceFact[]; tone: string; requestedSections: string[] };
export type WebsiteDraftResult = {
  draft: { title: string; summary: string; sections: Array<{ heading: string; body: string }>; seoTitle: string; metaDescription: string; suggestedAltText: string[]; internalLinkSuggestions: string[] };
  sourceFactIds: string[]; factualWarnings: string[]; provider: string; model: string; metadata: Record<string, unknown>;
};

const websiteDraftSchema = z.object({
  title: z.string().min(1), summary: z.string().min(1), sections: z.array(z.object({ heading: z.string(), body: z.string() })),
  seoTitle: z.string(), metaDescription: z.string(), suggestedAltText: z.array(z.string()), internalLinkSuggestions: z.array(z.string()),
  sourceFactIds: z.array(z.string()), factualWarnings: z.array(z.string()),
});

export interface AiProvider {
  generateBlogDraft(input: BlogGenerationInput, context: { companyName: string; serviceArea: string }): Promise<AiDraftResult>;
  generateWebsiteDraft(input: WebsiteDraftInput): Promise<WebsiteDraftResult>;
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

  async generateWebsiteDraft(input: WebsiteDraftInput): Promise<WebsiteDraftResult> {
    const response = await fetch(this.endpoint, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify({ model: this.model, task: "website_draft", input }), cache: "no-store", signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}.`);
    const payload = await response.json() as { draft?: unknown; model?: unknown; metadata?: unknown };
    const parsed = websiteDraftSchema.parse(payload.draft);
    return { draft: parsed, sourceFactIds: parsed.sourceFactIds, factualWarnings: parsed.factualWarnings, provider: new URL(this.endpoint).hostname, model: typeof payload.model === "string" ? payload.model : this.model, metadata: typeof payload.metadata === "object" && payload.metadata ? payload.metadata as Record<string, unknown> : {} };
  }
}

class OpenAiProvider implements AiProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}
  private async response(system: string, input: unknown): Promise<{ text: string; id?: string; usage?: unknown; model?: string }> {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify({ model: this.model, store: false, input: [{ role: "system", content: [{ type: "input_text", text: system }] }, { role: "user", content: [{ type: "input_text", text: JSON.stringify(input) }] }] }), cache: "no-store", signal: AbortSignal.timeout(90_000) });
    if (!response.ok) throw new Error(`OpenAI returned ${response.status}.`);
    const payload = await response.json() as { id?: string; model?: string; usage?: unknown; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const text = payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
    if (!text) throw new Error("OpenAI returned no text output.");
    return { text, id: payload.id, usage: payload.usage, model: payload.model };
  }
  async generateBlogDraft(input: BlogGenerationInput, context: { companyName: string; serviceArea: string }): Promise<AiDraftResult> {
    const system = "Draft a useful painting-company article using only supplied first-party facts. Never invent projects, reviews, locations, people, credentials, dates, products, or outcomes. Mark missing facts clearly. Return Markdown only. This is an unpublished draft.";
    const result = await this.response(system, { company: context.companyName, serviceArea: context.serviceArea, ...input });
    return { text: result.text, provider: "openai", model: result.model ?? this.model, metadata: { responseId: result.id, usage: result.usage } };
  }
  async generateWebsiteDraft(input: WebsiteDraftInput): Promise<WebsiteDraftResult> {
    const allowedIds = new Set(input.sourceFacts.map((fact) => fact.id));
    const system = `Create one unpublished painting-company website draft using only supplied source facts. Every factual claim must be supported by a source fact ID. Never invent employees, offices, projects, reviews, licenses, certifications, awards, history, years, warranties, products, cities, guarantees, or community involvement. Omit unsupported claims and add a factual warning. Return JSON only with keys title, summary, sections[{heading,body}], seoTitle, metaDescription, suggestedAltText, internalLinkSuggestions, sourceFactIds, factualWarnings.`;
    const result = await this.response(system, input); const raw = result.text.replace(/^```json\s*|\s*```$/g, ""); const parsed = websiteDraftSchema.parse(JSON.parse(raw));
    const invalidIds = parsed.sourceFactIds.filter((id) => !allowedIds.has(id)); if (invalidIds.length) parsed.factualWarnings.push(`Unknown source fact IDs: ${invalidIds.join(", ")}`);
    return { draft: parsed, sourceFactIds: parsed.sourceFactIds.filter((id) => allowedIds.has(id)), factualWarnings: parsed.factualWarnings, provider: "openai", model: result.model ?? this.model, metadata: { responseId: result.id, usage: result.usage } };
  }
}

export function getAiProvider(): AiProvider | null {
  const openAiKey = process.env.OPENAI_API_KEY; const openAiModel = process.env.OPENAI_MODEL;
  if (openAiKey && openAiModel) return new OpenAiProvider(openAiKey, openAiModel);
  const endpoint = process.env.AI_PROVIDER_ENDPOINT;
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  const model = process.env.AI_PROVIDER_MODEL;
  return endpoint && apiKey && model ? new HttpAiProvider(endpoint, apiKey, model) : null;
}
