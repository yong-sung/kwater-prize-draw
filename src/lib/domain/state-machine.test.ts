import { describe, expect, it } from "vitest";

import { assertTransition } from "./state-machine";

describe("assertTransition", () => {
  it.each([
    ["SETUP", "OPEN"],
    ["OPEN", "CLOSED"],
    ["CLOSED", "OPEN"],
    ["CLOSED", "DRAWN"],
    ["DRAWN", "REVEALING"],
    ["DRAWN", "REVEALED"],
    ["REVEALING", "REVEALING"],
    ["REVEALING", "REVEALED"],
    ["REVEALED", "PUBLISHED"],
    ["PUBLISHED", "PURGED"],
    ["PURGED", "SETUP"],
  ] as const)("%s에서 %s 전환을 허용한다", (from, to) => {
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  it("DRAWN에서 OPEN 전환을 거부한다", () => {
    expect(() => assertTransition("DRAWN", "OPEN")).toThrow(
      "허용되지 않는 행사 상태 전환",
    );
  });
});
