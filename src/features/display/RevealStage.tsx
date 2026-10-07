"use client";

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
  const showNextPrize =
    Boolean(nextPrizeName) &&
    !busy &&
    status !== "REVEALED" &&
    status !== "PUBLISHED";

  return (
    <section
      aria-label="당첨자 공개"
      className="flex min-h-[100dvh] flex-col bg-slate-950 p-8 text-white"
    >
      <header className="mx-auto w-full max-w-6xl py-6 text-center">
        <h1 className="text-4xl font-bold">당첨자 발표</h1>
        {showNextPrize ? (
          <p className="mt-3 text-xl">{nextPrizeName} 추첨 시작</p>
        ) : null}
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
          {busy ? "추첨 중...." : "Enter로 다음 당첨자 공개"}
        </button>
      )}
    </section>
  );
}
