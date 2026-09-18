"use client";
import { useState } from "react";
import DisplayApp from "./DisplayApp";
export default function DisplayGate() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  if (authenticated) return <DisplayApp />;
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form
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
        <h1>공용 비밀번호</h1>
        <label htmlFor="display-password">공용 비밀번호</label>
        <input
          id="display-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">로그인</button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
