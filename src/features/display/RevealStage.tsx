"use client";

export type RevealGroup = {
  prizeCode: string;
  prizeName: string;
  winners: Array<{ name: string; department: string }>;
};

export default function RevealStage({
  groups,
  status,
  onReveal,
  busy,
}: {
  groups: RevealGroup[];
  status: string;
  onReveal: () => void;
  busy: boolean;
}) {
  return (
    <section
      aria-label="당첨자 공개"
      className="flex min-h-[100dvh] flex-col bg-slate-950 p-8 text-white"
    >
      <header className="mx-auto w-full max-w-6xl py-6 text-center">
        <h1 className="text-4xl font-bold">당첨자 발표</h1>
        <p className="mt-3 text-xl">
          {status === "DRAWN"
            ? "Enter를 눌러 발표를 시작하세요."
            : "공개된 당첨자"}
        </p>
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
          {busy ? "공개 중..." : "Enter로 다음 당첨자 공개"}
        </button>
      )}
    </section>
  );
}
