import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventRealtimeClient } from "./events";
import {
  EVENT_SIGNAL_EVENT,
  broadcastEventSignal,
  createEventSignal,
  subscribeEventSignal,
} from "./events";

const eventId = "00000000-0000-4000-8000-000000000010";
const changedAt = "2026-09-15T01:00:00.000Z";

function realtimeDouble() {
  let signalHandler: (() => void) | undefined;
  let statusHandler: ((status: string) => void) | undefined;
  const channel = {
    on: vi.fn((_type: string, _filter: object, handler: () => void) => {
      signalHandler = handler;
      return channel;
    }),
    subscribe: vi.fn((handler: (status: string) => void) => {
      statusHandler = handler;
      return channel;
    }),
    httpSend: vi.fn().mockResolvedValue("ok"),
  };
  const client = {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn().mockResolvedValue("ok"),
  } as unknown as EventRealtimeClient;
  return {
    channel,
    client,
    emitSignal: () => signalHandler?.(),
    emitStatus: (status: string) => statusHandler?.(status),
  };
}

describe("EventSignal 계약", () => {
  beforeEach(() => vi.clearAllMocks());

  it("상태 변경에 필요한 값만 만들고 개인정보 필드를 포함하지 않는다", () => {
    const signal = createEventSignal(eventId, "PUBLISHED", changedAt);

    expect(signal).toEqual({ eventId, status: "PUBLISHED", changedAt });
    const serialized = JSON.stringify(signal);
    for (const forbidden of [
      "name",
      "phone",
      "department",
      "participantId",
      "prize",
      "accessToken",
      "ciphertext",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("행사별 public 채널에 개인정보 없는 신호만 Broadcast한다", async () => {
    const realtime = realtimeDouble();

    await broadcastEventSignal(
      realtime.client,
      eventId,
      "PUBLISHED",
      changedAt,
    );

    expect(realtime.client.channel).toHaveBeenCalledWith(
      `event:${eventId}:status`,
      expect.objectContaining({ config: expect.any(Object) }),
    );
    expect(realtime.channel.httpSend).toHaveBeenCalledWith(EVENT_SIGNAL_EVENT, {
      eventId,
      status: "PUBLISHED",
      changedAt,
    });
    expect(realtime.client.removeChannel).toHaveBeenCalledWith(
      realtime.channel,
    );
  });

  it("수신 payload를 전달하지 않고 재조회 callback만 실행한다", () => {
    const realtime = realtimeDouble();
    const refresh = vi.fn();
    const failed = vi.fn();

    subscribeEventSignal(realtime.client, eventId, {
      onSignal: refresh,
      onConnectionFailure: failed,
    });
    realtime.emitSignal();
    realtime.emitStatus("CHANNEL_ERROR");

    expect(refresh).toHaveBeenCalledWith();
    expect(failed).toHaveBeenCalledTimes(1);
  });
});
