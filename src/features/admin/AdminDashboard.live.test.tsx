import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "./AdminDashboard";

const signal = vi.hoisted(() => ({
  refresh: undefined as (() => void | Promise<void>) | undefined,
}));

vi.mock("@/features/participant/useEventSignal", () => ({
  useEventSignal: ({
    onRefresh,
  }: {
    onRefresh: () => void | Promise<void>;
  }) => {
    signal.refresh = onRefresh;
  },
}));

describe("관리자 최신 상태 반영", () => {
  beforeEach(() => {
    signal.refresh = undefined;
  });

  it("공개 완료 신호를 받으면 새로고침 없이 결과 발표 버튼을 활성화한다", async () => {
    let status = "REVEALING";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/api/admin/event") {
          return new Response(
            JSON.stringify({
              event: { id: "event-1", title: "리허설 행사", status },
            }),
            { status: 200 },
          );
        }
        if (url === "/api/admin/participants") {
          return new Response(JSON.stringify({ participants: [] }), {
            status: 200,
          });
        }
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }),
    );

    render(<AdminDashboard />);
    const publish = await screen.findByRole("button", { name: "결과 발표" });
    expect(publish).toBeDisabled();

    status = "REVEALED";
    await act(async () => {
      await signal.refresh?.();
    });

    await waitFor(() => expect(publish).toBeEnabled());
  });
});
