"use client";

import { useEffect, useRef } from "react";

export function useEnterReveal({
  enabled,
  onReveal,
  lockedMs = 500,
}: {
  enabled: boolean;
  onReveal: () => void;
  lockedMs?: number;
}) {
  const locked = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;
      const target = event.target as HTMLElement | null;
      if (
        target?.matches(
          "input, textarea, select, button, [contenteditable='true']",
        )
      )
        return;
      if (locked.current) return;
      locked.current = true;
      onReveal();
      window.setTimeout(() => {
        locked.current = false;
      }, lockedMs);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, lockedMs, onReveal]);
}
