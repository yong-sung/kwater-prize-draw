import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RevealStage from "./RevealStage";

describe("RevealStage", () => {
  it("추첨 시작 전 현재 경품명과 추첨 시작을 안내하고 경품마다 번호를 다시 매긴다", () => {
    render(
      <RevealStage
        groups={[
          {
            prizeCode: "KEYBOARD",
            prizeName: "기계식 키보드",
            winners: [
              { name: "홍길동", department: "본부" },
              { name: "김하나", department: "지사" },
            ],
          },
          {
            prizeCode: "TUMBLER",
            prizeName: "스탠리 텀블러",
            winners: [{ name: "이한울", department: "본부" }],
          },
        ]}
        status="DRAWN"
        nextPrizeName="기계식 키보드"
        onReveal={() => undefined}
        busy={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "당첨자 발표" })).toBeInTheDocument();
    expect(screen.getByText("기계식 키보드 추첨 시작")).toBeInTheDocument();
    expect(screen.queryByText("공개된 당첨자")).not.toBeInTheDocument();

    const keyboard = screen.getByRole("heading", { name: "기계식 키보드" }).closest("article");
    const tumbler = screen.getByRole("heading", { name: "스탠리 텀블러" }).closest("article");
    expect(within(keyboard!).getByLabelText("1번")).toBeInTheDocument();
    expect(within(keyboard!).getByLabelText("2번")).toBeInTheDocument();
    expect(within(tumbler!).getByLabelText("1번")).toBeInTheDocument();
  });

  it("추첨 진행 중에는 진행 문구를 표시한다", () => {
    render(
      <RevealStage
        groups={[]}
        status="REVEALING"
        nextPrizeName="스탠리 텀블러"
        onReveal={() => undefined}
        busy
      />,
    );

    expect(screen.getByRole("button", { name: "추첨 중...." })).toBeDisabled();
    expect(screen.queryByText("공개된 당첨자")).not.toBeInTheDocument();
  });

  it("REVEALED 상태에서는 완료 문구를 표시하고 다음 공개 버튼을 제공하지 않는다", () => {
    render(
      <RevealStage
        groups={[]}
        status="REVEALED"
        onReveal={() => undefined}
        busy={false}
      />,
    );
    expect(screen.getByText("모든 당첨자 공개 완료")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /다음 당첨자 공개/ }),
    ).not.toBeInTheDocument();
  });

  it("PUBLISHED 상태도 완료 문구를 표시하고 공개 버튼을 숨긴다", () => {
    render(
      <RevealStage
        groups={[]}
        status="PUBLISHED"
        onReveal={() => undefined}
        busy={false}
      />,
    );
    expect(screen.getByText("모든 당첨자 공개 완료")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
