import { render, screen } from "@testing-library/react";
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
});
