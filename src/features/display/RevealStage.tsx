"use client";

import Image from "next/image";
import styles from "./RevealStage.module.css";

export type RevealGroup = {
  prizeCode: string;
  prizeName: string;
  winners: Array<{ name: string; department: string }>;
};

const PRIZES = [
  {
    code: "TUMBLER",
    name: "스타벅스 텀블러",
    image: "/images/prizes/tumbler.png",
  },
  {
    code: "SCANNER",
    name: "코닥 라벨 에라 M50",
    image: "/images/prizes/scanner.png",
  },
  {
    code: "KEYBOARD",
    name: "기계식 키보드",
    image: "/images/prizes/keyboard-bangwool.png",
  },
];

export default function RevealStage({
  groups,
  status,
  nextPrizeName,
  onReveal,
  busy,
}: {
  groups: RevealGroup[];
  status: string;
  nextPrizeName?: string | null;
  onReveal: () => void;
  busy: boolean;
}) {
  const complete = status === "REVEALED" || status === "PUBLISHED";
  const startLabel = nextPrizeName ? `${nextPrizeName} 추첨 시작` : "추첨 시작";
  const cards = PRIZES.map((prize) => ({
    ...prize,
    group: groups.find((group) => group.prizeCode === prize.code),
  }));
  // 서버에서 공개한 추가 경품도 명단에서 누락하지 않는다.
  const extraGroups = groups.filter(
    (group) => !PRIZES.some((prize) => prize.code === group.prizeCode),
  );
  if (status === "DRAWN" && groups.length === 0 && !busy) {
    return (
      <section aria-label="당첨자 공개" className={styles.preDrawStage}>
        <div className={styles.sceneArea}>
          <div
            className={styles.scene}
            aria-label="레버 추첨 장식"
            style={{
              backgroundImage: 'url("/images/reveal/announcement-scene.png")',
            }}
          >
            <h1 className="sr-only">당첨자 발표</h1>
            <p role="status" className="sr-only">
              추첨 대기 중
            </p>
            <button
              type="button"
              onClick={onReveal}
              aria-label={nextPrizeName ? startLabel : "레버 돌리기"}
              className={styles.lever}
            >
              <span className="sr-only">레버 돌리기</span>
            </button>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section aria-label="당첨자 공개" className={styles.stage}>
      <div aria-hidden="true" className={styles.decorations}>
        {Array.from({ length: 12 }, (_, index) => (
          <i
            key={index}
            className={styles.confetti}
            style={{
              left: `${6 + index * 8}%`,
              top: `${4 + (index % 4) * 21}%`,
              rotate: `${index * 37 + 25}deg`,
            }}
          />
        ))}
        {Array.from({ length: 7 }, (_, index) => (
          <i
            key={index}
            className={styles.bubble}
            style={{
              left: `${3 + index * 15}%`,
              top: `${23 + (index % 3) * 27}%`,
              width: `${22 + (index % 3) * 24}px`,
            }}
          />
        ))}
      </div>
      <header className={styles.header}>
        <Image
          className={`${styles.mascot} ${styles.mascotLeft}`}
          src="/images/display/mascot-wave.png"
          alt=""
          width={320}
          height={320}
          unoptimized
        />
        <div className={styles.heading}>
          <h1>
            <Image
              className={styles.titleImage}
              src="/images/display/prize-draw-title.png"
              alt="경품 당첨자 발표"
              width={2161}
              height={728}
              preload
              unoptimized
            />
          </h1>
          {groups.some((group) => group.winners.length > 0) ? (
            <p className={styles.congratulations}>
              <Image
                className={styles.congratulationsImage}
                src="/images/display/congratulations.png"
                alt="당첨을 축하합니다!"
                width={2200}
                height={715}
                unoptimized
              />
            </p>
          ) : (
            <p>행운의 주인공을 기다립니다!</p>
          )}
        </div>
        <Image
          className={`${styles.mascot} ${styles.mascotRight}`}
          src="/images/display/mascot-cheer.png"
          alt=""
          width={320}
          height={320}
          unoptimized
        />
      </header>
      <div className={styles.cards}>
        {cards.map(({ code, name, image, group }) => (
          <article key={code} className={styles.card}>
            <div className={`${styles.product} ${styles[code.toLowerCase()]}`}>
              <div className={styles.productArtwork}>
                <Image
                  src={image}
                  alt={group?.prizeName ?? name}
                  width={600}
                  height={400}
                  unoptimized
                />
              </div>
            </div>
            <div className={styles.cardTitle}>
              <h2>{group?.prizeName ?? name}</h2>
              {group && group.winners.length > 0 && (
                <span className={styles.badge}>{group.winners.length}명</span>
              )}
            </div>
            {group && group.winners.length > 0 ? (
              <WinnerList group={group} />
            ) : (
              <div className={styles.waiting}>
                <span className={styles.waitingIcon} aria-hidden="true">
                  ✦
                </span>
                <p>공개 대기 중</p>
                <span>잠시 후 당첨자를 발표합니다</span>
              </div>
            )}
          </article>
        ))}
        {extraGroups.map((group) => (
          <article key={group.prizeCode} className={styles.card}>
            <div className={styles.cardTitle}>
              <h2>{group.prizeName}</h2>
              <span className={styles.badge}>{group.winners.length}명</span>
            </div>
            <WinnerList group={group} />
          </article>
        ))}
      </div>
      <footer className={styles.footer}>
        {complete ? (
          <p className={styles.complete}>모든 당첨자 공개 완료</p>
        ) : (
          <>
            <button
              type="button"
              onClick={onReveal}
              disabled={busy}
              className={styles.revealButton}
            >
              {busy ? "추첨 중...." : startLabel}
            </button>
            <p className={styles.hint}>
              Enter 키 또는 버튼을 눌러 당첨자를 공개하세요
            </p>
          </>
        )}
      </footer>
    </section>
  );
}

function WinnerList({ group }: { group: RevealGroup }) {
  return (
    <ul
      className={styles.winners}
      aria-label={`${group.prizeName} 당첨자 명단`}
    >
      {group.winners.map((winner, index) => (
        <li key={`${group.prizeCode}-${index}`} className={styles.winner}>
          <span aria-label={`${index + 1}번`} className={styles.number}>
            {index + 1}.
          </span>
          <div>
            <span className={styles.name}>{winner.name}</span>
            {winner.department && (
              <span className={styles.department}>{winner.department}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
