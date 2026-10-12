"use client";

import styles from "./RevealStage.module.css";

export type RevealGroup = {
  prizeCode: string;
  prizeName: string;
  winners: Array<{ name: string; department: string }>;
};

export default function RevealStage({
  groups,
  status,
  nextPrizeName,
  onReveal,
  busy,
}: {
  groups: RevealGroup[];
  status: string;
  nextPrizeName?: string | null;
  onReveal: () => void;
  busy: boolean;
}) {
  const startLabel = nextPrizeName ? `${nextPrizeName} 추첨 시작` : "추첨 시작";

  if (status === "DRAWN" && groups.length === 0 && !busy) {
    return (
      <section aria-label="당첨자 공개" className={styles.stage}>
        <div className={styles.sceneArea}>
          <div
            className={styles.scene}
            aria-label="레버 추첨 장식"
            style={{
              backgroundImage: 'url("/images/reveal/announcement-scene.png")',
            }}
          >
            <h1 className="sr-only">당첨자 발표</h1>
            <p role="status" className="sr-only">
              추첨 대기 중
            </p>
            <button
              type="button"
              onClick={onReveal}
              aria-label={nextPrizeName ? startLabel : "레버 돌리기"}
              className={styles.lever}
            >
              <span className="sr-only">레버 돌리기</span>
            </button>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section
      aria-label="당첨자 공개"
      className="flex min-h-[100dvh] flex-col bg-slate-950 p-8 text-white"
    >
      <header className="mx-auto w-full max-w-6xl py-6 text-center">
        <h1 className="text-4xl font-bold">당첨자 발표</h1>
      </header>
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 py-6 md:grid-cols-3">
        {groups.map((group) => (
          <article
            key={group.prizeCode}
            className="rounded-2xl bg-white/10 p-6"
          >
            <h2 className="text-2xl font-semibold">{group.prizeName}</h2>
            <ul className="mt-4 space-y-3">
              {group.winners.map((winner, index) => (
                <li key={`${group.prizeCode}-${index}`} className="text-xl">
                  <span
                    aria-label={`${index + 1}번`}
                    className="mr-2 inline-block min-w-8 text-right font-bold tabular-nums text-cyan-300"
                  >
                    {index + 1}.
                  </span>
                  <span className="font-bold">{winner.name}</span>
                  <span className="ml-2 text-slate-300">
                    {winner.department}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      {status === "REVEALED" || status === "PUBLISHED" ? (
        <p className="mx-auto rounded-xl px-8 py-4 text-lg font-bold text-cyan-300">
          모든 당첨자 공개 완료
        </p>
      ) : (
        <button
          type="button"
          onClick={onReveal}
          disabled={busy}
          className="mx-auto rounded-xl bg-cyan-400 px-8 py-4 text-lg font-bold text-slate-950 disabled:opacity-40"
        >
          {busy ? "추첨 중...." : startLabel}
        </button>
      )}
    </section>
  );
}
