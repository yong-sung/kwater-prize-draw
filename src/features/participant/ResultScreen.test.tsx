import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ResultScreen from "./ResultScreen";

describe("개인 결과 화면", () => {
  it.each([
    ["KEYBOARD", "/images/prizes/keyboard.png"],
    ["TUMBLER", "/images/prizes/tumbler.png"],
    ["SCANNER", "/images/prizes/scanner.jpg"],
  ] as const)(
    "당첨 경품 %s의 사진과 행복한 방울이를 표시한다",
    (prizeCode, src) => {
      render(
        <ResultScreen isWinner prizeCode={prizeCode} prizeName="테스트 경품" />,
      );

      expect(screen.getByAltText("테스트 경품 경품 사진")).toHaveAttribute(
        "src",
        expect.stringContaining(encodeURIComponent(src)),
      );
      expect(screen.getByAltText("행복해하는 방울이")).toBeInTheDocument();
    },
  );

  it("미당첨자는 경품 사진 없이 슬퍼하는 방울이를 표시한다", () => {
    render(<ResultScreen isWinner={false} />);
    expect(screen.getByAltText("슬퍼하는 방울이")).toBeInTheDocument();
    expect(screen.queryByAltText(/경품 사진/)).not.toBeInTheDocument();
  });
});
