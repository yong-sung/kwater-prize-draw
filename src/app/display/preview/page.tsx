"use client";

import { useEffect, useRef, useState } from "react";
import RevealStage, { type RevealGroup } from "@/features/display/RevealStage";

// 디자인 확인용 가상 명단. 추첨 API와 연결하지 않는다.
const groups = [
  { prizeCode: "KEYBOARD", prizeName: "기계식 키보드" },
  { prizeCode: "TUMBLER", prizeName: "스탠리 텀블러" },
  { prizeCode: "SCANNER", prizeName: "코닥 라벨 에라 M50" },
].map((prize) => ({
  ...prize,
  winners: Array.from({ length: 15 }, (_, index) => ({
    name: `이름 ${String(index + 1).padStart(2, "0")}`,
    department: [
      "기획조정실",
      "디지털혁신처",
      "수도관리처",
      "수자원관리처",
      "경영지원처",
    ][index % 5],
  })),
}));

export default function DisplayPreviewPage() {
  const [revealedGroups, setRevealedGroups] = useState<RevealGroup[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) clearInterval(timer.current);
    },
    [],
  );

  function revealDummyPrize() {
    if (timer.current !== null || revealedGroups.length === groups.length)
      return;
    const prize = groups[revealedGroups.length];
    const previousGroups = revealedGroups;
    let count = 0;
    setBusy(true);
    timer.current = setInterval(() => {
      count += 1;
      setRevealedGroups([
        ...previousGroups,
        { ...prize, winners: prize.winners.slice(0, count) },
      ]);
      if (count === 15) {
        clearInterval(timer.current!);
        timer.current = null;
        setBusy(false);
      }
    }, 200);
  }

  return (
    <RevealStage
      groups={revealedGroups}
      status={
        revealedGroups.length === groups.length && !busy
          ? "REVEALED"
          : "REVEALING"
      }
      nextPrizeName={groups[revealedGroups.length]?.prizeName}
      onReveal={revealDummyPrize}
      busy={busy}
    />
  );
}
