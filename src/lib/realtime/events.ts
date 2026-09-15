import type { SupabaseClient } from "@supabase/supabase-js";

export const EVENT_SIGNAL_EVENT = "state_changed";

export type EventSignalStatus =
  | "OPEN"
  | "CLOSED"
  | "DRAWN"
  | "REVEALING"
  | "REVEALED"
  | "PUBLISHED"
  | "PURGED";

export type EventSignal = {
  eventId: string;
  status: EventSignalStatus;
  changedAt: string;
};

export type EventRealtimeClient = Pick<
  SupabaseClient,
  "channel" | "removeChannel"
>;

export function eventSignalChannel(eventId: string): string {
  return `event:${eventId}:status`;
}

export function createEventSignal(
  eventId: string,
  status: EventSignalStatus,
  changedAt = new Date().toISOString(),
): EventSignal {
  return { eventId, status, changedAt };
}

export async function broadcastEventSignal(
  client: EventRealtimeClient,
  eventId: string,
  status: EventSignalStatus,
  changedAt?: string,
): Promise<void> {
  const channel = client.channel(eventSignalChannel(eventId), {
    config: { broadcast: { ack: true }, private: false },
  });
  try {
    await channel.httpSend(
      EVENT_SIGNAL_EVENT,
      createEventSignal(eventId, status, changedAt),
    );
  } finally {
    await client.removeChannel(channel);
  }
}

export function subscribeEventSignal(
  client: EventRealtimeClient,
  eventId: string,
  callbacks: {
    onSignal: () => void;
    onConnectionFailure: () => void;
    onConnected?: () => void;
  },
): () => void {
  const channel = client
    .channel(eventSignalChannel(eventId), { config: { private: false } })
    .on("broadcast", { event: EVENT_SIGNAL_EVENT }, () => {
      callbacks.onSignal();
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") callbacks.onConnected?.();
      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        callbacks.onConnectionFailure();
      }
    });

  return () => {
    void client.removeChannel(channel);
  };
}
