import { describe, expect, it } from "vitest";
import { findRedirectLoops } from "@/lib/seo/redirects";

describe("redirect validation", () => {
  it("finds loops and permits a permanent one-hop slug redirect", () => {
    expect(findRedirectLoops([{ fromPath: "/old", toPath: "/new", statusCode: 308 }])).toEqual([]);
    expect(findRedirectLoops([{ fromPath: "/a", toPath: "/b", statusCode: 308 }, { fromPath: "/b", toPath: "/a", statusCode: 301 }])).toHaveLength(1);
  });
});
