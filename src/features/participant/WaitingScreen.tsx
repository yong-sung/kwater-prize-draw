import Image from "next/image";
import noticeStyles from "./WaitingScreen.module.css";
import styles from "./GachaWaitingScreen.module.css";

export default function WaitingScreen() {
  return (
    <div className={styles.viewport}>
      <section className={styles.scene} aria-labelledby="entry-complete-title">
        <div className={styles.ribbon}>
          <svg viewBox="0 0 300 90" aria-hidden="true">
            <defs>
              <path id="waiting-ribbon-arc" d="M38 49 Q150 19 262 49" />
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
                href="#waiting-ribbon-arc"
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
            className={styles.background}
          />
          <Image
            src="/assets/banguli-success.png"
            alt="별 지팡이를 든 방울이"
            width={1024}
            height={1536}
            unoptimized
            loading="eager"
            className={styles.character}
          />
        </div>
        <div className={styles.content}>
          <header className={styles.message}>
            <h2 id="entry-complete-title" className={styles.title}>
              응모가 완료되었어요!
            </h2>
            <p className={styles.description}>
              <span>곧 당첨자를 추첨할 예정이에요.</span>{" "}
              <span>조금만 기다려주세요!</span>
            </p>
          </header>
          <aside className={`${noticeStyles.notice} ${styles.notice}`}>
            <p className={noticeStyles.noticeTitle}>
              <svg
                className={noticeStyles.noticeIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M10.3 4.2a2 2 0 0 1 3.4 0l8 13.8a2 2 0 0 1-1.7 3H4a2 2 0 0 1-1.7-3Z"
                  fill="#ffe5a3"
                  stroke="#b47c18"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 9v5"
                  stroke="#78521a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="17" r="1" fill="#78521a" />
              </svg>
              해당 페이지를 종료하지 마세요.
            </p>
            <p className={noticeStyles.noticeTiming}>
              추첨이 잠시 후 진행됩니다.
            </p>
            <p>
              <span>해당 페이지와 강연장 화면에서</span>
              <br />
              <span>추첨 결과를 확인하실 수 있습니다.</span>
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
