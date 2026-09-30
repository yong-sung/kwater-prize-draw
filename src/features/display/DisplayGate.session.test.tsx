import { act, render, screen, waitFor } from "@testing-library/react";
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
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/display/auth/session",
        expect.objectContaining({ cache: "no-store" }),
      ),
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
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/display/auth/session",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/display/event",
      expect.anything(),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/display/reveal",
      expect.anything(),
    );
  });
  it("세션 확인 서버 오류를 비밀번호 오류로 숨기지 않는다", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ code: "SERVER_ERROR" }), { status: 500 }),
    );
    render(<DisplayGate />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "강연장 인증 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  });
  it("세션 조회가 시간 안에 끝나지 않으면 준비 화면에 머물지 않는다", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          (init?.signal as AbortSignal | undefined)?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    render(<DisplayGate />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "강연장 인증 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  });
});
