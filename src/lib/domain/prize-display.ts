export const TUMBLER_DISPLAY_NAME = "스탠리 텀블러";

export function getPrizeDisplayName(code: string | undefined, name: string) {
  return code === "TUMBLER" || name.includes("텀블러")
    ? TUMBLER_DISPLAY_NAME
    : name;
}
