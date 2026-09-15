"use client";

import { useEffect } from "react";
import {
  subscribeEventSignal,
  type EventRealtimeClient,
} from "@/lib/realtime/events";
import { createRealtimeClient } from "@/lib/supabase/browser";

const DEFAULT_POLL_INTERVAL_MS = 5_000;

export function useEventSignal({
  eventId,
  onRefresh,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: {
  eventId?: string;
  onRefresh: () => void | Promise<void>;
  pollIntervalMs?: number;
}) {
  useEffect(() => {
    let disposed = false;
    let stopSubscription: (() => void) | undefined;
    let pollingTimer: number | undefined;

    const refreshFromApi = () => {
      if (disposed) return;
      void Promise.resolve(onRefresh()).catch(() => undefined);
    };
    const stopPolling = () => {
      if (pollingTimer === undefined) return;
      window.clearInterval(pollingTimer);
      pollingTimer = undefined;
    };
    const startPolling = () => {
      if (disposed || pollingTimer !== undefined) return;
      pollingTimer = window.setInterval(refreshFromApi, pollIntervalMs);
    };

    const connect = async () => {
      try {
        if (!eventId) throw new Error("EVENT_ID_MISSING");
        if (disposed) return;
        const client = createRealtimeClient();
        stopSubscription = subscribeEventSignal(
          client as EventRealtimeClient,
          eventId,
          {
            onSignal: refreshFromApi,
            onConnectionFailure: startPolling,
            onConnected: stopPolling,
          },
        );
      } catch {
        startPolling();
      }
    };

    void connect();
    return () => {
      disposed = true;
      stopPolling();
      stopSubscription?.();
    };
  }, [eventId, onRefresh, pollIntervalMs]);
}
