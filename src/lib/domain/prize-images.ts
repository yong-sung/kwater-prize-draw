import type { PrizeCode } from "./types";

export const PRIZE_IMAGE_BY_CODE: Record<PrizeCode, string> = {
  KEYBOARD: "/images/prizes/keyboard.png",
  TUMBLER: "/images/prizes/tumbler.png",
  SCANNER: "/images/prizes/scanner.jpg",
};

export function prizeImagePath(code: PrizeCode): string {
  return PRIZE_IMAGE_BY_CODE[code];
}
