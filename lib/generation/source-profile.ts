import type { SourceFact } from "@/lib/ai/provider";

function walk(value: unknown, path: string, facts: SourceFact[]) {
  if (value === null || value === undefined || value === "") return;
  if (Array.isArray(value)) { value.forEach((item, index) => walk(item, `${path}.${index}`, facts)); return; }
  if (typeof value === "object") { Object.entries(value as Record<string, unknown>).forEach(([key, item]) => walk(item, `${path}.${key}`, facts)); return; }
  facts.push({ id: `onboarding:${path}`, field: path, value });
}

export function buildSourceFacts(answers: Record<string, Record<string, unknown>>): SourceFact[] {
  const facts: SourceFact[] = [];
  Object.entries(answers).forEach(([section, values]) => walk(values, section, facts));
  return facts;
}

