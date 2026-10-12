import Image from "next/image";
import type { ReactNode } from "react";
import shared from "./WaitingScreen.module.css";
import styles from "./WinnerScreen.module.css";

type ResultSceneProps = {
  children: ReactNode;
  labelledBy: string;
  variant: "winner" | "losing";
};

export default function ResultScene({
  children,
  labelledBy,
  variant,
}: ResultSceneProps) {
  return (
    <div className={shared.viewport}>
      <section
        className={`${shared.scene} ${styles.scene} ${variant === "losing" ? styles.losingScene : ""}`}
        aria-labelledby={labelledBy}
      >
        <Image
          src="/assets/park-background.webp"
          alt=""
          fill
          unoptimized
          loading="eager"
          className={`${shared.background} ${styles.background}`}
        />
        <div className={`${shared.content} ${styles.content}`}>
          <div className={`${shared.ticket} ${styles.ticket}`}>
            <Image
              src="/assets/ticket-frame.png"
              alt=""
              width={1025}
              height={1535}
              unoptimized
              loading="eager"
              className={`${shared.frame} ${styles.frame}`}
            />
            <div
              className={
                variant === "winner" ? styles.confetti : styles.quietDecor
              }
              aria-hidden="true"
            >
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className={styles.ticketContent}>
              {children}
              <Image
                src="/assets/foreground-clouds22222.png"
                alt=""
                width={1774}
                height={887}
                unoptimized
                loading="eager"
                className={styles.clouds}
              />
              <div className={styles.footCloud} aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
