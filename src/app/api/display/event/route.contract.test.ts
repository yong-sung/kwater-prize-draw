import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/app/api/display/event/route.ts", "utf8");

describe("display event route 계약", () => {
  it("display 세션과 공개 결과 필터 및 명시적 FK를 사용한다", () => {
    expect(source).toContain("requireDisplaySession");
    expect(source).toContain('.not("revealed_at", "is", null)');
    expect(source).toContain("prizes!draw_results_prize_id_fkey");
    expect(source).toContain("participants!draw_results_participant_id_fkey");
  });

  it("다음 추첨 경품명을 공개하지 않은 결과에서 결정한다", () => {
    expect(source).toContain('nextPrizeName');
    expect(source).toContain('.is("revealed_at", null)');
    expect(source).toContain("reveal_position");
  });

  it("공개 최소 필드만 복호화하고 민감 필드를 조회하지 않는다", () => {
    expect(source).toContain("name_ciphertext");
    expect(source).toContain("department_ciphertext");
    expect(source).toContain("decryptPii");
    expect(source).not.toContain("phone_ciphertext");
    expect(source).not.toContain("access_token");
    expect(source).not.toContain("service_role");
  });
});
