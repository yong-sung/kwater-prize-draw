"use client";

import { FormEvent, useEffect, useState } from "react";

type AdminLoginProps = { onSuccess?: () => void };

type LoginError = {
  error?: string;
  blockedUntil?: string;
};

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!blockedUntil) return;
    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil((blockedUntil - Date.now()) / 1000),
      );
      setRemainingSeconds(remaining);
      if (remaining === 0) setBlockedUntil(null);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [blockedUntil]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || blockedUntil) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as LoginError;
      setPassword("");
      if (!response.ok) {
        if (result.blockedUntil) {
          setBlockedUntil(new Date(result.blockedUntil).getTime());
        }
        setError(result.error ?? "로그인할 수 없습니다.");
        return;
      }
      onSuccess?.();
    } catch {
      setPassword("");
      setError("네트워크 연결을 확인하고 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  const blocked = blockedUntil !== null && remainingSeconds > 0;

  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold text-sky-600">관리자 전용</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          행사 관리자 로그인
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          행사 운영용 공용 비밀번호를 입력해 주세요.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-2 block text-sm font-semibold text-slate-800"
            htmlFor="admin-password"
          >
            관리자 비밀번호
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting || blocked}
            required
            className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base text-slate-950 outline-none transition focus:border-sky-500 focus:ring-3 focus:ring-sky-100 disabled:bg-slate-100"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
            {blocked ? " (" + remainingSeconds + "초 후 다시 시도)" : ""}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting || blocked || password.length === 0}
          className="min-h-12 w-full rounded-xl bg-sky-600 px-5 font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "확인 중..." : "로그인"}
        </button>
      </form>
    </section>
  );
}
