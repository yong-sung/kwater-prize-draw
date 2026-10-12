import Image from "next/image";
import type { PrizeCode } from "@/lib/domain/types";
import { prizeImagePath } from "@/lib/domain/prize-images";
import ResultScene from "./ResultScene";
import styles from "./WinnerScreen.module.css";

type WinnerScreenProps = {
  prizeCode?: PrizeCode;
  prizeName?: string;
};

export default function WinnerScreen({
  prizeCode,
  prizeName,
}: WinnerScreenProps) {
  return (
    <ResultScene variant="winner" labelledBy="winner-title">
      <svg className={styles.star} viewBox="0 0 40 40" aria-hidden="true">
        <path
          d="m20 3 5.3 10.7 11.8 1.7-8.5 8.3 2 11.7L20 29.9 9.4 35.4l2-11.7L2.9 15.4l11.8-1.7Z"
          fill="#ffd16b"
          stroke="#ffba36"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <h2 id="winner-title" className={styles.title}>
        축하합니다!
      </h2>
      <p className={styles.subtitle}>이벤트에 당첨되셨어요!</p>
      {prizeCode && prizeName ? (
        <div id="winner-prize" className={styles.prize} tabIndex={-1}>
          <div className={styles.prizeStage} data-prize-code={prizeCode}>
            <Image
              src={prizeImagePath(prizeCode)}
              alt={prizeName + " 경품 사진"}
              width={480}
              height={360}
              sizes="(max-width: 430px) 75vw, 300px"
              className={styles.prizeImage}
            />
          </div>
          <p className={styles.prizeName}>{prizeName}</p>
        </div>
      ) : null}
      <Image
        src="/assets/banguli_winner.png"
        alt="행복해하는 방울이"
        width={1312}
        height={1199}
        unoptimized
        loading="eager"
        className={styles.character}
      />
      {prizeCode && prizeName ? (
        <a href="#winner-prize" role="button" className={styles.confirm} hidden>
          확인하기
        </a>
      ) : (
        <button type="button" className={styles.confirm} disabled hidden>
          확인하기
        </button>
      )}
    </ResultScene>
  );
}
