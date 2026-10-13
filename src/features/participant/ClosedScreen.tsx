import Image from "next/image";
import noticeStyles from "./WaitingScreen.module.css";
import styles from "./GachaWaitingScreen.module.css";
import closed from "./ClosedScreen.module.css";

export default function ClosedScreen() {
  return (
    <div className={styles.viewport}>
      <section className={styles.scene} aria-labelledby="entry-closed-title">
        <div className={styles.ribbon}>
          <svg viewBox="0 0 300 90" aria-hidden="true">
            <defs>
              <path id="closed-ribbon-arc" d="M38 49 Q150 19 262 49" />
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
                href="#closed-ribbon-arc"
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
            src="/assets/응모배경.png"
            alt=""
            fill
            unoptimized
            loading="eager"
            className={`${styles.background} ${closed.background}`}
          />
          <Image
            src="/assets/banguli_losing.png"
            alt="응모 마감을 아쉬워하는 방울이"
            width={1024}
            height={1536}
            unoptimized
            loading="eager"
            className={`${styles.character} ${closed.character}`}
          />
        </div>
        <div className={styles.content}>
          <header className={styles.message}>
            <h2 id="entry-closed-title" className={styles.title}>
              <span>응모가 마감되었어요!</span>
            </h2>
            <p className={styles.description}>
              <span>이번 이벤트의 응모가 종료되었습니다.</span>{" "}
              <span>많은 관심과 참여 감사합니다.</span>
            </p>
          </header>
        </div>
      </section>
    </div>
  );
}
