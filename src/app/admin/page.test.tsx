import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPage from "./page";

describe("관리자 페이지 세션 복구", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("HttpOnly 쿠키 세션이 있으면 새로고침 후 관리자 화면을 복구한다", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          event: { id: "event-1", title: "행사", status: "OPEN" },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    render(<AdminPage />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "행사" })).toBeInTheDocument(),
    );
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/admin/event", {
      credentials: "same-origin",
      cache: "no-store",
    });
  });
});
