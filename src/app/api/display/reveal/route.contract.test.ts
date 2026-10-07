import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/app/api/display/reveal/route.ts", "utf8");

describe("display reveal route 계약", () => {
  it("display 세션만 사용해 reveal_next_in_group을 호출한다", () => {
    expect(source).toContain("requireDisplaySession");
    expect(source).toContain('"reveal_next_in_group"');
    expect(source).not.toContain("requireAdmin");
  });

  it("관리자 reveal API와 분리된 최소 상태 응답을 반환한다", () => {
    expect(source).toContain('"REVEALED"');
    expect(source).toContain('"REVEALING"');
    expect(source).not.toContain("phone_ciphertext");
    expect(source).not.toContain("ciphertext");
  });
});
