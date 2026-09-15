"use client";

import { useCallback, useEffect, useState } from "react";
import QrStage from "./QrStage";
import RevealStage, { type RevealGroup } from "./RevealStage";
import { useEnterReveal } from "./useEnterReveal";

type EventData = { id: string; title: string; status: string };
export default function DisplayApp() {
  const [event, setEvent] = useState<EventData | null>(null);
  const [groups, setGroups] = useState<RevealGroup[]>([]);
  const [status, setStatus] = useState("SETUP");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const response = await fetch("/api/public/event", { cache: "no-store" });
    if (!response.ok) throw new Error("EVENT_NOT_FOUND");
    const data = (await response.json()) as EventData;
    return data;
  }, []);
  useEffect(() => {
    void load()
      .then((data) => {
        setEvent(data);
        setStatus(data.status);
      })
      .catch(() => {
        queueMicrotask(() => setError("??깃텢???븍뜄???????곷뮸??덈뼄."));
      });
  }, [load]);
  const reveal = useCallback(async () => {
    if (!event || status === "REVEALED" || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/reveal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });
      if (!response.ok) throw new Error("REVEAL_FAILED");
      const data = await response.json();
      setStatus(data.eventStatus);
      setGroups(data.groups ?? []);
    } catch {
      setError("??????????????????됰꽡???怨?????덊렡.");
    } finally {
      setBusy(false);
    }
  }, [event, status, busy]);
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
        ??됰씭??????몄툗 濚?..
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
