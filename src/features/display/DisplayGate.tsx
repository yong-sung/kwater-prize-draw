"use client";

import { useState } from "react";
import DisplayApp from "./DisplayApp";

export default function DisplayGate() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (authenticated) return <DisplayApp />;

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-950 p-8 text-white">
      <form
        className="w-full max-w-xl space-y-6 rounded-3xl bg-white/10 p-8 shadow-2xl backdrop-blur sm:p-12"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await fetch("/api/display/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ password }),
          });
          if (!r.ok) {
            setError("공용 비밀번호가 올바르지 않습니다.");
            return;
          }
          setAuthenticated(true);
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
            비밀번호가 올바르지 않습니다.
          </p>
        )}
      </form>
    </main>
  );
}
