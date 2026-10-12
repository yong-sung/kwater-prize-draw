import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ResultScreen from "./ResultScreen";

describe("개인 결과 화면", () => {
  it.each([
    ["KEYBOARD", "/images/prizes/keyboard.png"],
    ["TUMBLER", "/images/prizes/tumbler.png"],
    ["SCANNER", "/images/prizes/scanner.png"],
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
      expect(screen.getByAltText("행복해하는 방울이")).toHaveAttribute(
        "src",
        "/assets/banguli_winner.png",
      );
      expect(
        screen.getByRole("heading", { name: "축하합니다!" }),
      ).toBeInTheDocument();
      expect(screen.getByText("이벤트에 당첨되셨어요!")).toBeInTheDocument();
      expect(screen.getAllByAltText(/경품 사진/)).toHaveLength(1);
      expect(
        screen.queryByRole("button", { name: "확인하기" }),
      ).not.toBeInTheDocument();
      expect(document.querySelector('a[href="#winner-prize"]')).toHaveAttribute(
        "hidden",
      );
    },
  );

  it("미당첨자는 경품 사진 없이 슬퍼하는 방울이를 표시한다", () => {
    render(<ResultScreen isWinner={false} />);
    expect(screen.getByAltText("슬퍼하는 방울이")).toBeInTheDocument();
    expect(screen.getByAltText("슬퍼하는 방울이")).toHaveAttribute(
      "src",
      "/assets/banguli_losing.png",
    );
    expect(
      screen.getByRole("heading", { name: "아쉽지만 당첨되지 않았어요" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("이벤트에 참여해 주셔서 감사합니다."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByAltText(/경품 사진/)).not.toBeInTheDocument();
  });
});
