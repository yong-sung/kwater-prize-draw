import Image from "next/image";
import styles from "./WaitingScreen.module.css";
import closed from "./ClosedScreen.module.css";

export default function ClosedScreen() {
  return (
    <div className={styles.viewport}>
      <section
        className={`${styles.scene} ${closed.scene}`}
        aria-labelledby="entry-closed-title"
      >
        <Image
          src="/assets/park-background.webp"
          alt=""
          fill
          unoptimized
          loading="eager"
          className={`${styles.background} ${closed.background}`}
        />
        <div className={styles.content}>
          <div className={`${styles.ribbon} ${closed.ribbon}`}>
            <svg viewBox="0 0 300 90" aria-hidden="true">
              <defs>
                <path id="closed-ribbon-arc" d="M38 49 Q150 19 262 49" />
              </defs>
              <path
                d="M30 35 3 49 21 60 15 83 64 69 236 69 285 83 279 60 297 49 270 35Z"
                fill="#dfe6ef"
              />
              <path
                d="M30 25Q150-13 270 25L256 67Q150 36 44 67Z"
                fill="#f8f9fc"
                stroke="#fff"
                strokeWidth="2"
              />
              <text className={styles.ribbonText}>
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
          <div className={styles.ticket}>
            <Image
              src="/assets/ticket-frame.png"
              alt=""
              width={982}
              height={1602}
              unoptimized
              loading="eager"
              className={`${styles.frame} ${closed.frame}`}
            />
            <div className={styles.message}>
              <svg
                className={styles.star}
                viewBox="0 0 40 40"
                aria-hidden="true"
              >
                <path
                  d="m20 3 5.3 10.7 11.8 1.7-8.5 8.3 2 11.7L20 29.9 9.4 35.4l2-11.7L2.9 15.4l11.8-1.7Z"
                  fill="#b8c3d1"
                  stroke="#aab6c5"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <h2
                id="entry-closed-title"
                className={`${styles.title} ${closed.title}`}
              >
                <span>응모</span> <span>마감되었습니다!</span>
              </h2>
              <p className={`${styles.description} ${closed.description}`}>
                <span>AI 인사이트 라운드 경품 추첨 이벤트는</span>{" "}
                <span>마감되었습니다.</span>
              </p>
            </div>
            <div className={styles.characterStage}>
              <Image
                src="/assets/banguli-closed.png"
                alt="응모 마감을 아쉬워하는 방울이"
                width={1024}
                height={1536}
                unoptimized
                loading="eager"
                className={`${styles.character} ${closed.character}`}
              />
              <Image
                src="/assets/foreground-clouds.png"
                alt=""
                width={1774}
                height={887}
                unoptimized
                loading="eager"
                className={`${styles.clouds} ${closed.clouds}`}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
