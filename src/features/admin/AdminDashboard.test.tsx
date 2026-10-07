import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "./AdminDashboard";

describe("관리자 대시보드", () => {
  it("행사 없음 상태를 표시한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ event: null }) }),
    );
    render(<AdminDashboard />);
    expect(
      await screen.findByText("진행 중인 행사가 없습니다."),
    ).toBeInTheDocument();
  });

  it("Production 환경에서는 Preview 리허설 초기화 영역을 표시하지 않는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            event: {
              id: "event-1",
              title: "Preview 검증 행사",
              status: "OPEN",
            },
            rehearsalResetAllowed: false,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ participants: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        }),
    );

    render(<AdminDashboard />);

    await screen.findByRole("heading", { name: "Preview 검증 행사" });
    expect(
      screen.queryByRole("heading", { name: "Preview 리허설 초기화" }),
    ).not.toBeInTheDocument();
  });

  it("초기화 API가 Preview 비활성 코드를 반환하면 원인을 안내한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            event: {
              id: "event-1",
              title: "Preview 검증 행사",
              status: "PUBLISHED",
            },
            rehearsalResetAllowed: true,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ participants: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ code: "REHEARSAL_RESET_DISABLED" }),
        }),
    );

    render(<AdminDashboard />);

    await screen.findByRole("heading", { name: "Preview 리허설 초기화" });
    fireEvent.change(screen.getByLabelText("행사명 확인"), {
      target: { value: "Preview 검증 행사" },
    });
    fireEvent.change(screen.getByLabelText("확인 문구"), {
      target: { value: "리허설 초기화" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "리허설 데이터 초기화" }),
    );

    expect(
      await screen.findByText(
        "리허설 초기화는 허용된 Preview 환경에서만 사용할 수 있습니다. Preview 주소인지 확인해 주세요.",
      ),
    ).toBeInTheDocument();
  });

  it("당첨자의 성명 전체와 소속부서를 표시하고 내부 ID는 표시하지 않는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            event: {
              id: "event-1",
              title: "Preview 검증 행사",
              status: "DRAWN",
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ participants: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                id: "result-1",
                participantId: "internal-participant-id",
                winner: { name: "홍길동", department: "물관리부" },
                prize: { name: "텀블러", code: "TUMBLER" },
                unawarded: false,
              },
            ],
          }),
        }),
    );

    render(<AdminDashboard />);

    expect(await screen.findByText("홍길동 · 물관리부")).toBeInTheDocument();
    expect(screen.getByText("텀블러")).toBeInTheDocument();
    expect(screen.queryByText(/internal-/)).not.toBeInTheDocument();
  });

  it("CLOSED 상태에서만 응모 재개 버튼을 활성화한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            event: { id: "event-1", title: "가짜 리허설", status: "CLOSED" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ participants: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        }),
    );
    render(<AdminDashboard />);
    expect(
      await screen.findByRole("button", { name: "응모 재개" }),
    ).toBeEnabled();
  });
});
