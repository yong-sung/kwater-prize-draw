import Image from "next/image";
import noticeStyles from "./WaitingScreen.module.css";
import styles from "./GachaWaitingScreen.module.css";
import winner from "./GachaWinnerScreen.module.css";
import type { PrizeCode } from "@/lib/domain/types";
import { prizeImagePath } from "@/lib/domain/prize-images";
import { PRIZE_DISPLAY_NAMES } from "./prize-display";

type WinnerScreenProps = { prizeCode?: PrizeCode; prizeName?: string };

export default function WinnerScreen({
  prizeCode,
  prizeName,
}: WinnerScreenProps) {
  const displayName = prizeCode ? PRIZE_DISPLAY_NAMES[prizeCode] : prizeName;
  return (
    <div className={styles.viewport}>
      <section
        className={`${styles.scene} ${winner.scene}`}
        aria-labelledby="winner-title"
      >
        <div className={styles.ribbon}>
          <svg viewBox="0 0 300 90" aria-hidden="true">
            <defs>
              <path id="winner-ribbon-arc" d="M38 49 Q150 19 262 49" />
            </defs>
            <path
              d="M30 35 3 49 21 60 15 83 64 69Z M270 35 297 49 279 60 285 83 236 69Z"
              fill="#dff3ff"
            />
            <path
              d="M30 25Q150-13 270 25L256 67Q150 36 44 67Z"
              fill="#f8fcff"
              stroke="#fff"
              strokeWidth="2"
            />
            <text className={noticeStyles.ribbonText}>
              <textPath
                href="#winner-ribbon-arc"
                startOffset="50%"
                textAnchor="middle"
              >
                AI INSIGHT ROUND
              </textPath>
            </text>
          </svg>
          <p className="sr-only">AI INSIGHT ROUND</p>
        </div>
        <div className={styles.artwork}>
          <Image
            src="/assets/당첨배경.png"
            alt=""
            fill
            unoptimized
            loading="eager"
            className={styles.background}
          />
          {prizeCode && prizeName ? (
            <div id="winner-prize" className={winner.prize} tabIndex={-1}>
              <div className={winner.prizeStage} data-prize-code={prizeCode}>
                <Image
                  src={prizeImagePath(prizeCode)}
                  alt={displayName + " 경품 사진"}
                  width={480}
                  height={360}
                  sizes="(max-width: 430px) 75vw, 300px"
                  className={winner.prizeImage}
                />
              </div>
            </div>
          ) : null}
          {prizeCode && prizeName ? (
            <p className={winner.prizeName}>{displayName}</p>
          ) : null}
          <Image
            src="/assets/banguli_winner.png"
            alt="행복해하는 방울이"
            width={1312}
            height={1199}
            unoptimized
            loading="eager"
            className={`${styles.character} ${winner.character}`}
          />
        </div>
        <div className={styles.content}>
          <header className={`${styles.message} ${winner.message}`}>
            <h2 id="winner-title" className={`${styles.title} ${winner.title}`}>
              당첨되었습니다!
            </h2>
            <p className={winner.description}>
              <span>당첨을 축하합니다.</span>
              <span>해당 화면을 보여주시면</span>
              <span>상품으로 교환해 드립니다</span>
            </p>
          </header>
          {prizeCode && prizeName ? (
            <a
              href="#winner-prize"
              role="button"
              className={winner.confirm}
              hidden
            >
              확인하기
            </a>
          ) : (
            <button type="button" className={winner.confirm} disabled hidden>
              확인하기
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
