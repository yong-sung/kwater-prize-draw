import { describe, expect, it, vi } from "vitest";

describe("useEnterReveal", () => {
  it("紐⑤뱢???꾩쭅 援ы쁽?섏? ?딆븘 ?ㅽ뙣?쒕떎", async () => {
    const imported = await import("./useEnterReveal").catch(() => null);
    expect(imported).not.toBeNull();
    expect(vi).toBeDefined();
  });
});
