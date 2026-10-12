import Image from "next/image";
import ResultScene from "./ResultScene";
import styles from "./WinnerScreen.module.css";

export default function LosingScreen() {
  return (
    <ResultScene variant="losing" labelledBy="losing-title">
      <svg className={styles.rainCloud} viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M12 31a9 9 0 1 1 1-18 11 11 0 0 1 22-1 9 9 0 1 1 1 19Z"
          fill="#65c7ff"
        />
        <path
          d="M14 35q-7 10 0 10t0-10m10-1q-7 10 0 10t0-10m10 1q-7 10 0 10t0-10"
          fill="#45b8f4"
        />
      </svg>
      <h2 id="losing-title" className={`${styles.title} ${styles.losingTitle}`}>
        <span>아쉽지만</span> <span>당첨되지 않았어요</span>
      </h2>
      <p className={`${styles.subtitle} ${styles.losingSubtitle}`}>
        이벤트에 참여해 주셔서 감사합니다.
      </p>
      <Image
        src="/assets/banguli_losing.png"
        alt="슬퍼하는 방울이"
        width={1024}
        height={1536}
        unoptimized
        loading="eager"
        className={`${styles.character} ${styles.losingCharacter}`}
      />
    </ResultScene>
  );
}
