import Image from "next/image";
import styles from "./WaitingScreen.module.css";

export default function WaitingScreen() {
  return (
    <div className={styles.viewport}>
      <section className={styles.scene} aria-labelledby="entry-complete-title">
        <Image
          src="/assets/park-background.webp"
          alt=""
          fill
          unoptimized
          loading="eager"
          className={styles.background}
        />
        <div className={styles.content}>
          <div className={styles.ribbon}>
            <svg viewBox="0 0 300 90" aria-hidden="true">
              <path
                d="M30 35 3 49 21 60 15 83 64 69 236 69 285 83 279 60 297 49 270 35Z"
                fill="#d9f3ff"
              />
              <path
                d="M30 25Q150-13 270 25L256 67Q150 36 44 67Z"
                fill="#f5fcff"
                stroke="#fff"
                strokeWidth="2"
              />
            </svg>
            <p>AI INSIGHT ROUND</p>
          </div>
          <div className={styles.ticket}>
            <Image
              src="/assets/ticket-frame.png"
              alt=""
              width={982}
              height={1602}
              unoptimized
              loading="eager"
              className={styles.frame}
            />
            <div className={styles.message}>
              <svg
                className={styles.star}
                viewBox="0 0 40 40"
                aria-hidden="true"
              >
                <path
                  d="m20 3 5.3 10.7 11.8 1.7-8.5 8.3 2 11.7L20 29.9 9.4 35.4l2-11.7L2.9 15.4l11.8-1.7Z"
                  fill="#ffd16b"
                  stroke="#ffba36"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <h2 id="entry-complete-title" className={styles.title}>
                <span>응모</span> <span>완료되었습니다!</span>
              </h2>
              <p className={styles.description}>
                <span>AI 인사이트 라운드 경품 추첨 이벤트에</span>{" "}
                <span>참여해 주셔서 감사합니다.</span>
              </p>
            </div>
            <div className={styles.characterStage}>
              <Image
                src="/assets/banguli-success.png"
                alt="별 지팡이를 든 방울이"
                width={1024}
                height={1536}
                unoptimized
                loading="eager"
                className={styles.character}
              />
              <Image
                src="/assets/foreground-clouds.png"
                alt=""
                width={1774}
                height={887}
                unoptimized
                loading="eager"
                className={styles.clouds}
              />
            </div>
          </div>
          <aside className={styles.notice}>
            <p className={styles.noticeTitle}>해당 페이지를 종료하지 마세요.</p>
            <p>추첨은 행사 종료 직후 진행됩니다.</p>
            <p>
              해당 페이지와 강연장 화면에서 추첨 결과를 확인하실 수 있습니다.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
