import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AdminDashboard } from "./AdminDashboard";

it("행사 조회 응답의 title을 제목과 설정 입력값으로 표시한다", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          event: {
            id: "00000000-0000-4000-8000-000000000001",
            title: "Preview 검증 행사",
            status: "OPEN",
          },
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
    await screen.findByRole("heading", { name: "Preview 검증 행사" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("행사명")).toHaveValue("Preview 검증 행사");
});
