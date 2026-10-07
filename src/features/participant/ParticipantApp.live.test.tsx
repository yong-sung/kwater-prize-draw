import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ParticipantApp from "./ParticipantApp";

const signal = vi.hoisted(() => ({
  refresh: undefined as (() => void | Promise<void>) | undefined,
}));

vi.mock("./useEventSignal", () => ({
  useEventSignal: ({
    onRefresh,
  }: {
    onRefresh: () => void | Promise<void>;
  }) => {
    signal.refresh = onRefresh;
  },
}));

describe("참석자 결과 자동 반영", () => {
  beforeEach(() => {
    localStorage.setItem("kwater-prize-access-token", "test-token");
    signal.refresh = undefined;
  });

  it("발표 신호 뒤 API를 다시 조회해 새로고침 없이 당첨 화면으로 전환한다", async () => {
    let published = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify(
              published
                ? {
                    state: "WINNER",
                    name: "테스트 참가자",
                    prizeCode: "KEYBOARD",
                    prizeName: "기계식 키보드",
                  }
                : { state: "WAITING" },
            ),
            { status: 200 },
          ),
      ),
    );

    render(<ParticipantApp />);
    expect(
      await screen.findByText(/응모가 완료되었습니다/),
    ).toBeInTheDocument();

    published = true;
    await act(async () => {
      await signal.refresh?.();
    });

    expect(await screen.findByText(/기계식 키보드/)).toBeInTheDocument();
    expect(screen.getByAltText("기계식 키보드 경품 사진")).toBeInTheDocument();
  });
});
