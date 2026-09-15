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
});
