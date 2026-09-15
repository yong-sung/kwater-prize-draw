import { describe, expect, it } from "vitest";

describe("DisplayApp", () => {
  it("怨듦컻 ?붾㈃ 而댄룷?뚰듃瑜??쒓났?쒕떎", async () => {
    const imported = await import("./DisplayApp").catch(() => null);
    expect(imported).not.toBeNull();
  });
});
