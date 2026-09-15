export function ParticipantTable({ count }: { count: number }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">참석자 현황</h2>
      <p className="mt-2">총 {count}명</p>
    </section>
  );
}
