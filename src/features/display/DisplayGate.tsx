"use client";

import { useEffect, useState } from "react";
import DisplayApp from "./DisplayApp";

type SessionStatus = "checking" | "authenticated" | "unauthenticated" | "error";

const REQUEST_TIMEOUT_MS = 8_000;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}
export default function DisplayGate() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("checking");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetchWithTimeout("/api/display/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) return false;
        if (!response.ok) throw new Error("DISPLAY_SESSION_FAILED");
        const body = (await response.json()) as { authenticated?: boolean };
        return body.authenticated === true;
      })
      .then((authenticated) => {
        if (active)
          setSessionStatus(authenticated ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (active) setSessionStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  if (sessionStatus === "checking") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-slate-950 p-8 text-xl text-white">
        강연장 화면을 준비하고 있습니다.
      </main>
    );
  }

  if (sessionStatus === "authenticated") return <DisplayApp />;

  if (sessionStatus === "error") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-slate-950 p-8 text-center text-white">
        <p role="alert">
          강연장 인증 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-950 p-8 text-white">
      <form
        className="w-full max-w-xl space-y-6 rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur sm:p-12"
        onSubmit={async (e) => {
          e.preventDefault();
          const response = await fetchWithTimeout("/api/display/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ password }),
          });
          if (!response.ok) {
            setError("공용 비밀번호가 올바르지 않습니다.");
            return;
          }
          setSessionStatus("authenticated");
        }}
      >
        <h1 className="text-center text-4xl font-bold sm:text-5xl">
          공용 비밀번호
        </h1>
        <label
          htmlFor="display-password"
          className="block text-xl font-semibold text-slate-100"
        >
          공용 비밀번호
        </label>
        <input
          id="display-password"
          type="password"
          className="min-h-14 w-full rounded-xl border border-white/30 bg-white px-4 text-xl text-slate-950 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/30"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="min-h-14 w-full rounded-xl bg-cyan-400 px-6 text-xl font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          로그인
        </button>
        {error && (
          <p
            role="alert"
            className="text-center text-lg font-semibold text-red-300"
          >
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
