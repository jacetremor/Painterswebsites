import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sourceFiles = globSync(["app/**/*.tsx", "components/**/*.tsx"]);
const disallowedIconImports = /from\s+["'](?:@heroicons\/[^"']+|react-icons(?:\/[^"']+)?|@phosphor-icons\/[^"']+|@tabler\/icons-react)["']/;

describe("website icon system", () => {
  it("configures shadcn/ui to generate Lucide icons", () => {
    const config = JSON.parse(readFileSync("components.json", "utf8")) as { iconLibrary?: string };
    expect(config.iconLibrary).toBe("lucide");
  });

  it("does not introduce competing icon libraries or hand-authored SVG icons", () => {
    for (const file of sourceFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} imports a non-Lucide icon library`).not.toMatch(disallowedIconImports);
      expect(source, `${file} contains a hand-authored SVG icon`).not.toMatch(/<svg(?:\s|>)/);
    }
  });
});
