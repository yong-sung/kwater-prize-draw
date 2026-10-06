import { describe, expect, it } from "vitest";
import { orderRevealGroups } from "./reveal-order";

describe("강연장 경품 공개 순서", () => {
  it("입력 순서와 무관하게 KEYBOARD → TUMBLER → SCANNER로 정렬한다", () => {
    expect(
      orderRevealGroups([
        { prizeCode: "SCANNER", prizeName: "카닥", winners: [] },
        { prizeCode: "KEYBOARD", prizeName: "키보드", winners: [] },
        { prizeCode: "TUMBLER", prizeName: "텀블러", winners: [] },
      ]).map((group) => group.prizeCode),
    ).toEqual(["KEYBOARD", "TUMBLER", "SCANNER"]);
  });
});
