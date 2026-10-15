import type { PrizeCode } from "@/lib/domain/types";
import { TUMBLER_DISPLAY_NAME } from "@/lib/domain/prize-display";

// 결과 데이터는 유지하고 참가자 화면의 표시 명칭만 통일합니다.
export const PRIZE_DISPLAY_NAMES: Record<PrizeCode, string> = {
  KEYBOARD: "방울이 기계식 키보드",
  TUMBLER: TUMBLER_DISPLAY_NAME,
  SCANNER: "코닥 라벨 에라",
};
