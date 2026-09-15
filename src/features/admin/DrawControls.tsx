export function DrawControls({
  disabled,
  onDraw,
}: {
  disabled: boolean;
  onDraw: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onDraw}
      className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white disabled:bg-slate-300"
    >
      추첨 실행
    </button>
  );
}
