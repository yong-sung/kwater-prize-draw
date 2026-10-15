import type { PrizeCode } from "@/lib/domain/types";
import WinnerScreen from "./WinnerScreen";
import LosingScreen from "./LosingScreen";

type ResultScreenProps = {
  isWinner: boolean;
  prizeCode?: PrizeCode;
  prizeName?: string;
  name?: string;
  department?: string;
};

export default function ResultScreen({
  isWinner,
  prizeCode,
  prizeName,
  name,
  department,
}: ResultScreenProps) {
  return isWinner ? (
    <WinnerScreen
      prizeCode={prizeCode}
      prizeName={prizeName}
      name={name}
      department={department}
    />
  ) : (
    <LosingScreen />
  );
}
