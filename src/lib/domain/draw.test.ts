import { describe, expect, it } from "vitest";
import { assertDrawInvariants } from "./draw";

describe("추첨 결과 불변식", () => {
  it("참석자 중복을 거부한다", () => {
    expect(() =>
      assertDrawInvariants({
        results: [
          { participantId: "p1", prizeId: "a" },
          { participantId: "p1", prizeId: "b" },
        ],
        prizeLimits: { a: 1, b: 1 },
      }),
    ).toThrow("DUPLICATE_WINNER");
  });

  it("경품 수량 초과를 거부한다", () => {
    expect(() =>
      assertDrawInvariants({
        results: [
          { participantId: "p1", prizeId: "a" },
          { participantId: "p2", prizeId: "a" },
        ],
        prizeLimits: { a: 1 },
      }),
    ).toThrow("PRIZE_LIMIT_EXCEEDED");
  });
});
