import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/app/api/public/event/route.ts", "utf8");

describe("public event route 회귀 계약", () => {
  it("참석자용 행사 메타데이터와 상태만 반환한다", () => {
    expect(source).toContain("PublicEventResponse");
    expect(source).toContain("participantCount");
    expect(source).not.toContain("name_ciphertext");
    expect(source).not.toContain("department_ciphertext");
    expect(source).not.toContain("groups");
    expect(source).not.toContain("decryptPii");
  });
});
