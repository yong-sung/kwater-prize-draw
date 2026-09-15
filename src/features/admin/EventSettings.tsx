export function EventSettings({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">행사 설정</h2>
      <p className="mt-2">{name}</p>
      <p className="text-sm text-slate-600">상태: {status}</p>
    </section>
  );
}
