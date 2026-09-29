"use client";
import { useCallback, useEffect, useState } from "react";
type Participant = {
  id: string;
  event_id: string;
  department: string;
  disqualified_at?: string | null;
};
type Result = {
  id: string;
  participantId: string | null;
  winner: { name: string; department: string } | null;
  prize: { name: string; code: string } | null;
  unawarded: boolean;
};
type Data = {
  event: { id: string; title: string; status: string };
  participants?: number;
  prizes?: number;
};
export function AdminDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [resetTitle, setResetTitle] = useState("");
  const [resetConfirmation, setResetConfirmation] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/event");
      if (!r.ok) throw Error();
      const d = await r.json();
      setData(d);
      setTitle(d.event?.title ?? "");
      if (d.event) {
        setDetailLoading(true);
        const [p, q] = await Promise.all([
          fetch("/api/admin/participants"),
          fetch(`/api/admin/results?eventId=${encodeURIComponent(d.event.id)}`),
        ]);
        if (!p.ok || !q.ok) throw Error();
        setParticipants((await p.json()).participants ?? []);
        setResults((await q.json()).results ?? []);
      }
    } catch {
      setError("관리자 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
      setDetailLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function call(path: string, body: object, next?: string) {
    if (busy || !data) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(path, {
        method: path.endsWith("event") ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw Error();
      if (next) setData({ ...data, event: { ...data.event, status: next } });
      await load();
    } catch {
      setError("요청을 처리하지 못했습니다. 상태와 권한을 확인하세요.");
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p role="status">불러오는 중…</p>;
  if (!data?.event)
    return (
      <section role="alert" className="rounded-xl bg-white p-6">
        {error || "진행 중인 행사가 없습니다."}
      </section>
    );
  const e = data.event;
  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <header>
        <p className="text-sm font-semibold text-sky-700">관리자 대시보드</p>
        <h1 className="text-3xl font-bold text-slate-950">{e.title}</h1>
        <p className="mt-2 text-slate-600">현재 상태: {e.status}</p>
      </header>
      <form
        onSubmit={(x) => {
          x.preventDefault();
          void call("/api/admin/event", { eventId: e.id, title });
        }}
        className="rounded-2xl bg-white p-5 shadow-sm"
      >
        <label htmlFor="event-title" className="block text-sm font-semibold">
          행사명
        </label>
        <input
          id="event-title"
          value={title}
          onChange={(x) => setTitle(x.target.value)}
          required
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"
        />
        <button
          disabled={busy}
          className="mt-3 rounded-xl bg-slate-800 px-4 py-2 font-semibold text-white disabled:bg-slate-300"
        >
          설정 저장
        </button>
      </form>
      <div className="grid gap-3 sm:grid-cols-4">
        <button
          disabled={busy || e.status !== "OPEN"}
          onClick={() =>
            void call(
              "/api/admin/event",
              { eventId: e.id, status: "CLOSED" },
              "CLOSED",
            )
          }
          className="rounded-xl bg-amber-600 p-4 font-semibold text-white disabled:bg-slate-300"
        >
          응모 마감
        </button>
        <button
          disabled={busy || e.status !== "CLOSED"}
          onClick={() =>
            void call(
              "/api/admin/event",
              { eventId: e.id, status: "OPEN", expectedStatus: "CLOSED" },
              "OPEN",
            )
          }
          className="rounded-xl bg-cyan-700 p-4 font-semibold text-white disabled:bg-slate-300"
        >
          응모 재개
        </button>
        <button
          disabled={busy || e.status !== "CLOSED"}
          onClick={() => void call("/api/admin/draw", { eventId: e.id })}
          className="rounded-xl bg-sky-600 p-4 font-semibold text-white disabled:bg-slate-300"
        >
          추첨 실행
        </button>
        <button
          disabled={busy || e.status !== "REVEALED"}
          onClick={() =>
            void call("/api/admin/publish", { eventId: e.id }, "PUBLISHED")
          }
          className="rounded-xl bg-emerald-600 p-4 font-semibold text-white disabled:bg-slate-300"
        >
          결과 발표
        </button>
      </div>
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-lg font-semibold text-red-900">
          Preview 리허설 초기화
        </h2>
        <p className="mt-1 text-sm text-red-800">
          참석자 개인정보와 추첨·공개 결과를 삭제하고 행사·경품 설정은
          유지합니다.
        </p>
        <label
          className="mt-3 block text-sm font-semibold"
          htmlFor="reset-title"
        >
          행사명 확인
        </label>
        <input
          id="reset-title"
          value={resetTitle}
          onChange={(x) => setResetTitle(x.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border px-3"
        />
        <label
          className="mt-3 block text-sm font-semibold"
          htmlFor="reset-confirmation"
        >
          확인 문구
        </label>
        <input
          id="reset-confirmation"
          value={resetConfirmation}
          onChange={(x) => setResetConfirmation(x.target.value)}
          placeholder="리허설 초기화"
          className="mt-1 min-h-11 w-full rounded-xl border px-3"
        />
        <button
          type="button"
          disabled={
            busy ||
            resetTitle !== e.title ||
            resetConfirmation !== "리허설 초기화"
          }
          onClick={() =>
            void call(
              "/api/admin/rehearsal-reset",
              {
                eventId: e.id,
                eventTitle: resetTitle,
                confirmation: resetConfirmation,
              },
              "SETUP",
            )
          }
          className="mt-3 rounded-xl bg-red-700 px-4 py-2 font-semibold text-white disabled:bg-slate-300"
        >
          리허설 데이터 초기화
        </button>
      </section>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">참가자 목록</h2>
        {detailLoading ? (
          <p role="status">참가자 정보를 불러오는 중…</p>
        ) : participants.length ? (
          <ul className="divide-y">
            {participants.map((p) => (
              <li key={p.id} className="flex justify-between py-3 text-sm">
                <span>{p.department || "소속 미입력"}</span>
                <span>{p.disqualified_at ? "제외됨" : "응모"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">참가자가 없습니다.</p>
        )}
      </section>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">당첨 결과</h2>
        {detailLoading ? (
          <p role="status">결과를 불러오는 중…</p>
        ) : results.length ? (
          <ul className="divide-y">
            {results.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <span>
                  {r.winner
                    ? `${r.winner.name} · ${r.winner.department}`
                    : "미배정"}
                </span>
                <span>{r.prize?.name ?? "경품 없음"}</span>
                <button
                  disabled={busy || e.status === "PUBLISHED" || r.unawarded}
                  onClick={() => {
                    if (confirm("동일 경품으로 재추첨하시겠습니까?"))
                      void call("/api/admin/replacement", {
                        eventId: e.id,
                        resultId: r.id,
                        reason: "관리자 재추첨",
                      });
                  }}
                  className="rounded-lg border px-3 py-1 disabled:opacity-40"
                >
                  재추첨
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">아직 추첨 결과가 없습니다.</p>
        )}
      </section>
    </section>
  );
}
