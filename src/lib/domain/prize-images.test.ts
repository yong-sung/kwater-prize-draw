import { describe, expect, it } from "vitest";
import { prizeImagePath } from "./prize-images";

describe("경품 이미지 매핑", () => {
  it.each([
    ["KEYBOARD", "/images/prizes/keyboard.png"],
    ["TUMBLER", "/images/prizes/tumbler.png"],
    ["SCANNER", "/images/prizes/scanner.jpg"],
  ] as const)("%s 코드를 실제 이미지 경로로 연결한다", (code, expected) => {
    expect(prizeImagePath(code)).toBe(expected);
  });
});
