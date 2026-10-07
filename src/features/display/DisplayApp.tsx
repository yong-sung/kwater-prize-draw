"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QrStage from "./QrStage";
import RevealStage, { type RevealGroup } from "./RevealStage";
import { orderRevealGroups } from "./reveal-order";
import { revealPrizeGroup, type RevealStep } from "./revealPrizeGroup";
import { useEnterReveal } from "./useEnterReveal";
import { useEventSignal } from "@/features/participant/useEventSignal";

type EventData = {
  id: string;
  title: string;
  status: string;
  groups?: RevealGroup[];
};
export default function DisplayApp() {
  const [event, setEvent] = useState<EventData | null>(null);
  const [groups, setGroups] = useState<RevealGroup[]>([]);
  const [status, setStatus] = useState("SETUP");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshing = useRef(false);
  const revealing = useRef(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/display/event", {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("EVENT_NOT_FOUND");
    return (await response.json()) as EventData;
  }, []);
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const data = await load();
      setEvent(data);
      setStatus(data.status);
      setGroups(orderRevealGroups(data.groups ?? []));
      setError(null);
    } catch {
      setError("행사 정보를 불러오지 못했습니다.");
    } finally {
      refreshing.current = false;
    }
  }, [load]);
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  useEventSignal({ eventId: event?.id, onRefresh: refresh });
  const requestReveal = useCallback(
    async (expectedPrizeCode: string | null): Promise<RevealStep> => {
      if (!event) throw new Error("EVENT_NOT_FOUND");
      const response = await fetch("/api/display/reveal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId: event.id, expectedPrizeCode }),
      });
      if (!response.ok) throw new Error("REVEAL_FAILED");
      return (await response.json()) as RevealStep;
    },
    [event],
  );
  const reveal = useCallback(async () => {
    if (!event || status === "REVEALED" || revealing.current) return;
    revealing.current = true;
    setBusy(true);
    setError(null);
    try {
      await revealPrizeGroup({ reveal: requestReveal, refresh });
    } catch {
      setError("당첨자 공개를 진행하지 못했습니다.");
    } finally {
      revealing.current = false;
      setBusy(false);
    }
  }, [event, status, requestReveal, refresh]);
  useEnterReveal({
    enabled: status === "DRAWN" || status === "REVEALING",
    onReveal: reveal,
  });
  if (error)
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p role="alert">{error}</p>
      </main>
    );
  if (!event)
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        행사 정보를 불러오는 중…
      </main>
    );
  if (["DRAWN", "REVEALING", "REVEALED", "PUBLISHED"].includes(status))
    return (
      <RevealStage
        groups={groups}
        status={status}
        onReveal={reveal}
        busy={busy}
      />
    );
  return <QrStage title={event.title} />;
}
