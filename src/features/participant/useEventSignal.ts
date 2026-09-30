"use client";

import { useEffect } from "react";
import {
  subscribeEventSignal,
  type EventRealtimeClient,
} from "@/lib/realtime/events";
import { createRealtimeClient } from "@/lib/supabase/browser";

const DEFAULT_POLL_INTERVAL_MS = 3_000;

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
    const refreshFromApi = () => {
      if (disposed) return;
      void Promise.resolve(onRefresh()).catch(() => undefined);
    };
    const pollingTimer = window.setInterval(refreshFromApi, pollIntervalMs);

    const connect = async () => {
      try {
        if (!eventId) return;
        if (disposed) return;
        const client = createRealtimeClient();
        stopSubscription = subscribeEventSignal(
          client as EventRealtimeClient,
          eventId,
          {
            onSignal: refreshFromApi,
            onConnectionFailure: () => undefined,
          },
        );
      } catch {
        // Polling continues when Realtime is unavailable.
      }
    };

    void connect();
    return () => {
      disposed = true;
      window.clearInterval(pollingTimer);
      stopSubscription?.();
    };
  }, [eventId, onRefresh, pollIntervalMs]);
}
