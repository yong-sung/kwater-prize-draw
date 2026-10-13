import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import RevealStage from "./RevealStage";

describe("RevealStage", () => {
  it("캡슐 머신의 레버를 클릭하면 공개 요청을 한 번 전달한다", async () => {
    const onReveal = vi.fn();
    render(
      <RevealStage
        groups={[]}
        status="DRAWN"
        onReveal={onReveal}
        busy={false}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "레버 돌리기" }));
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("레버 추첨 장식")).toHaveStyle({
      backgroundImage: 'url("/images/reveal/announcement-scene.png")',
    });
  });
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

    expect(
      screen.getByRole("heading", { name: "경품 당첨자 발표" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "경품 당첨자 발표" }),
    ).toHaveAttribute("src", "/images/display/prize-draw-title.png");
    expect(
      screen.getByRole("img", { name: "당첨을 축하합니다!" }),
    ).toHaveAttribute("src", "/images/display/congratulations.png");
    expect(
      screen.getByRole("button", { name: "기계식 키보드 추첨 시작" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("공개된 당첨자")).not.toBeInTheDocument();

    const keyboard = screen
      .getByRole("heading", { name: "기계식 키보드" })
      .closest("article");
    const tumbler = screen
      .getByRole("heading", { name: "스탠리 텀블러" })
      .closest("article");
    expect(within(keyboard!).getByLabelText("1번")).toBeInTheDocument();
    expect(within(keyboard!).getByLabelText("2번")).toBeInTheDocument();
    expect(within(tumbler!).getByLabelText("1번")).toBeInTheDocument();
    expect(within(keyboard!).getByText("2명")).toBeInTheDocument();
    expect(within(tumbler!).getByText("1명")).toBeInTheDocument();
    expect(
      within(keyboard!).getByRole("img", { name: "기계식 키보드" }),
    ).toBeInTheDocument();
    expect(within(keyboard!).getByText("본부")).toBeInTheDocument();
  });

  it("다음 경품명을 추첨 시작 버튼에 표시한다", () => {
    render(
      <RevealStage
        groups={[]}
        status="REVEALING"
        nextPrizeName="스탠리 텀블러"
        onReveal={() => undefined}
        busy={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: "스탠리 텀블러 추첨 시작" }),
    ).toBeEnabled();
    expect(screen.getAllByText("공개 대기 중")).toHaveLength(3);
    expect(screen.queryByText("15명")).not.toBeInTheDocument();
  });

  it("대기 화면은 추첨 준비 상태 메시지와 장식 요소를 표시한다", () => {
    render(
      <RevealStage
        groups={[]}
        status="DRAWN"
        nextPrizeName="기계식 키보드"
        onReveal={() => undefined}
        busy={false}
      />,
    );

    expect(screen.getByText("추첨 대기 중")).toBeInTheDocument();
    expect(screen.getByLabelText("레버 추첨 장식")).toBeInTheDocument();
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
