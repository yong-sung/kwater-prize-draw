import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DisplayGate from "./DisplayGate";

vi.mock("./DisplayApp", () => ({
  default: () => <div data-testid="display-app-marker">display app</div>,
}));

describe("DisplayGate 세션 복원", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("세션 확인 전과 미인증 상태에서는 결과 API를 호출하지 않는다", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ authenticated: false }), { status: 200 }),
      );
    render(<DisplayGate />);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/display/auth/session", {
        cache: "no-store",
      }),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/display/event",
      expect.anything(),
    );
    expect(screen.queryByTestId("display-app-marker")).not.toBeInTheDocument();
  });

  it("유효한 세션이면 새로고침 진입 후 DisplayApp을 복원한다", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ authenticated: true }), { status: 200 }),
      );
    render(<DisplayGate />);
    await waitFor(() =>
      expect(screen.getByTestId("display-app-marker")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/display/auth/session", {
      cache: "no-store",
    });
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/display/event",
      expect.anything(),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/display/reveal",
      expect.anything(),
    );
  });
});
