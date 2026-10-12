import type { PrizeCode } from "@/lib/domain/types";
import WinnerScreen from "./WinnerScreen";
import LosingScreen from "./LosingScreen";

type ResultScreenProps = {
  isWinner: boolean;
  prizeCode?: PrizeCode;
  prizeName?: string;
};

export default function ResultScreen({
  isWinner,
  prizeCode,
  prizeName,
}: ResultScreenProps) {
  return isWinner ? (
    <WinnerScreen prizeCode={prizeCode} prizeName={prizeName} />
  ) : (
    <LosingScreen />
  );
}
