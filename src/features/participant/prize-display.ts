import type { PrizeCode } from "@/lib/domain/types";

// 결과 데이터는 유지하고 참가자 화면의 표시 명칭만 통일합니다.
export const PRIZE_DISPLAY_NAMES: Record<PrizeCode, string> = {
  KEYBOARD: "방울이 기계식 키보드",
  TUMBLER: "스타벅스 X 스탠리 텀블러",
  SCANNER: "코닥 라벨 에라",
};
