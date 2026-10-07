import { useCallback, useEffect, useState } from "react";
import { ParticipantView } from "./types";
import { useEventSignal } from "./useEventSignal";

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
// Note: Re-exporting generateAccessToken internally or defining here.
function generateAccessToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  return btoa(binString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function useParticipantState() {
  const [view, setView] = useState<ParticipantView>({ kind: "LOADING" });
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | undefined>();
  const refreshFromApi = useCallback(async () => {
    const token = localStorage.getItem("kwater-prize-access-token");
    const response = token
      ? await fetchWithTimeout("/api/participants/result", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
      : await fetchWithTimeout("/api/public/event", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    if (data.state === "WAITING") setView({ kind: "WAITING", name: "" });
    if (data.state === "WINNER")
      setView({
        kind: "WINNER",
        name: data.name,
        prizeCode: data.prizeCode,
        prizeName: data.prizeName,
      });
    if (data.state === "NOT_WINNER")
      setView({ kind: "NOT_WINNER", name: data.name });
    if (!token && data.status === "OPEN") setView({ kind: "FORM" });
    if (!token && data.status === "PURGED") setView({ kind: "PURGED" });
    if (!token && data.status !== "OPEN" && data.status !== "PURGED") {
      setView({ kind: "CLOSED" });
    }
  }, []);

  useEventSignal({ eventId, onRefresh: refreshFromApi });

  useEffect(() => {
    async function loadState() {
      try {
        const token = localStorage.getItem("kwater-prize-access-token");
        if (token) {
          const res = await fetchWithTimeout("/api/participants/result", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.state === "WAITING") {
              setView({ kind: "WAITING", name: "" });
            } else if (data.state === "WINNER") {
              setView({
                kind: "WINNER",
                name: data.name,
                prizeCode: data.prizeCode,
                prizeName: data.prizeName,
              });
            } else if (data.state === "NOT_WINNER") {
              setView({ kind: "NOT_WINNER", name: data.name });
            }
            return;
          }
        }

        const res = await fetchWithTimeout("/api/public/event");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.id === "string") setEventId(data.id);
          if (data.status === "OPEN") {
            setView({ kind: "FORM" });
          } else if (data.status === "PURGED") {
            setView({ kind: "PURGED" });
          } else {
            setView({ kind: "CLOSED" });
          }
        } else {
          setView({
            kind: "ERROR",
            message:
              "행사 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          });
        }
      } catch {
        setView({
          kind: "ERROR",
          message:
            "행사 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        });
      }
    }
    loadState();
  }, []);

  const submitForm = async (data: {
    name: string;
    phone: string;
    department: string;
    privacyConsent: boolean;
  }) => {
    try {
      const accessToken = generateAccessToken();
      const res = await fetchWithTimeout("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, accessToken }),
      });

      if (res.ok) {
        localStorage.setItem("kwater-prize-access-token", accessToken);
        setView({ kind: "WAITING", name: data.name });
      } else {
        const errorData = await res.json();
        setError(errorData.error || "오류가 발생했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
  };

  return { view, submitForm, error };
}
