import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  channel: vi.fn(),
  removeChannel: vi.fn(),
  signalHandler: undefined as (() => void) | undefined,
  statusHandler: undefined as ((status: string) => void) | undefined,
}));

vi.mock("@/lib/supabase/browser", () => ({
  createRealtimeClient: () => ({
    channel: mocks.channel,
    removeChannel: mocks.removeChannel,
  }),
}));

import { useEventSignal } from "./useEventSignal";

describe("useEventSignal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signalHandler = undefined;
    mocks.statusHandler = undefined;
    const channel = {
      on: vi.fn((_type: string, _filter: object, handler: () => void) => {
        mocks.signalHandler = handler;
        return channel;
      }),
      subscribe: vi.fn((handler: (status: string) => void) => {
        mocks.statusHandler = handler;
        return channel;
      }),
    };
    mocks.channel.mockReturnValue(channel);
    mocks.removeChannel.mockResolvedValue("ok");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: "event-10", status: "OPEN" }), {
          status: 200,
        }),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("Broadcast 수신 시 payload 대신 권한에 맞는 API 재조회를 요청한다", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    renderHook(() =>
      useEventSignal({ eventId: "event-1", onRefresh: refresh }),
    );
    await waitFor(() => expect(mocks.channel).toHaveBeenCalled());

    act(() => mocks.signalHandler?.());

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("Realtime 연결 상태와 무관하게 3초 간격 polling을 유지한다", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    vi.useFakeTimers();
    renderHook(() =>
      useEventSignal({ eventId: "event-1", onRefresh: refresh }),
    );

    await act(async () => vi.advanceTimersByTimeAsync(2_999));
    expect(refresh).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("정상 구독 상태에서도 polling을 실행한다", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    vi.useFakeTimers();
    renderHook(() =>
      useEventSignal({ eventId: "event-1", onRefresh: refresh }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(10_000));
    expect(refresh).toHaveBeenCalledTimes(3);
  });
});
