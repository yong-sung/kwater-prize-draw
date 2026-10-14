import Image from "next/image";
import ribbonStyles from "./WaitingScreen.module.css";
import styles from "./GachaWaitingScreen.module.css";
import resultStyles from "./GachaWinnerScreen.module.css";
import losingStyles from "./GachaLosingScreen.module.css";

export default function LosingScreen() {
  return (
    <div className={styles.viewport}>
      <section className={styles.scene} aria-labelledby="losing-title">
        <div className={styles.ribbon}>
          <svg viewBox="0 0 300 90" aria-hidden="true">
            <defs>
              <path id="losing-ribbon-arc" d="M38 49 Q150 19 262 49" />
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
            <text className={ribbonStyles.ribbonText}>
              <textPath
                href="#losing-ribbon-arc"
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
            src="/assets/미당첨배경.png"
            alt=""
            fill
            unoptimized
            loading="eager"
            className={styles.background}
          />
          <Image
            src="/assets/banguli_losing.png"
            alt="슬퍼하는 방울이"
            width={1024}
            height={1536}
            unoptimized
            loading="eager"
            className={`${styles.character} ${losingStyles.character}`}
          />
        </div>
        <div className={styles.content}>
          <header
            className={`${styles.message} ${resultStyles.message} ${losingStyles.message}`}
          >
            <h2
              id="losing-title"
              className={`${styles.title} ${resultStyles.title} ${losingStyles.title}`}
            >
              미당첨도 당첨이다!
            </h2>
            <p
              className={`${resultStyles.description} ${losingStyles.description}`}
            >
              <span>상품은 놓쳤지만, 참여는 성공!</span>
              <span>이벤트에 함께해 주셔서 감사합니다.</span>
            </p>
          </header>
        </div>
      </section>
    </div>
  );
}
