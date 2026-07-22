export type RedirectRule = { fromPath: string; toPath: string; statusCode: 301 | 308 | 410 };

export function findRedirectLoops(rules: RedirectRule[]): string[][] {
  const active = new Map(rules.filter((rule) => rule.statusCode !== 410).map((rule) => [rule.fromPath, rule.toPath]));
  const loops: string[][] = [];
  for (const start of active.keys()) {
    const path: string[] = [];
    const seen = new Map<string, number>();
    let current: string | undefined = start;
    while (current && active.has(current)) {
      const cycleStart = seen.get(current);
      if (cycleStart !== undefined) {
        const loop = [...path.slice(cycleStart), current];
        const signature = [...new Set(loop)].sort().join("|");
        if (!loops.some((known) => [...new Set(known)].sort().join("|") === signature)) loops.push(loop);
        break;
      }
      seen.set(current, path.length);
      path.push(current);
      current = active.get(current);
    }
  }
  return loops;
}
