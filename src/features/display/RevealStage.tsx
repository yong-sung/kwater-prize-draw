"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { useEnterReveal } from "./useEnterReveal";
import styles from "./RevealStage.module.css";

export type RevealGroup = {
  prizeCode: string;
  prizeName: string;
  winners: Array<{ name: string; department: string }>;
};

const PRIZES = [
  {
    code: "KEYBOARD",
    name: "기계식 키보드",
    image: "/images/prizes/keyboard-bangwool.png",
  },
  {
    code: "TUMBLER",
    name: "스탠리 텀블러",
    image: "/images/prizes/cut_tumbler.png",
  },
  {
    code: "SCANNER",
    name: "코닥 라벨 에라 M50",
    image: "/images/prizes/scanner.png",
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
  const [presentationOpen, setPresentationOpen] = useState(false);
  const showIntro =
    status === "DRAWN" && groups.length === 0 && !presentationOpen;
  useEnterReveal({
    enabled: !busy && (status === "DRAWN" || status === "REVEALING"),
    onReveal: showIntro ? () => setPresentationOpen(true) : onReveal,
  });
  const complete = status === "REVEALED" || status === "PUBLISHED";
  const displayNextPrizeName = nextPrizeName?.replace(
    "스타벅스 텀블러",
    "스탠리 텀블러",
  );
  const startLabel = displayNextPrizeName
    ? `${displayNextPrizeName} 추첨 시작`
    : "추첨 시작";
  const cards = PRIZES.map((prize) => {
    const group = groups.find((group) => group.prizeCode === prize.code);
    return {
      ...prize,
      group:
        group && prize.code === "TUMBLER"
          ? { ...group, prizeName: prize.name }
          : group,
    };
  });
  // 서버에서 공개한 추가 경품도 명단에서 누락하지 않는다.
  const extraGroups = groups.filter(
    (group) => !PRIZES.some((prize) => prize.code === group.prizeCode),
  );
  if (showIntro) {
    return (
      <section aria-label="당첨자 공개" className={styles.preDrawStage}>
        <div className={styles.sceneArea}>
          <div
            className={styles.scene}
            aria-label="레버 추첨 장식"
            style={{
              backgroundImage:
                'url("/images/reveal/announcement-scene-v2.png")',
            }}
          >
            <h1 className="sr-only">당첨자 발표</h1>
            <p className="sr-only">제4차 AI 인사이트 라운드</p>
            <p className="sr-only">AI본부 디지털관리처</p>
            <p role="status" className="sr-only">
              {busy ? "추첨 중" : "추첨 대기 중"}
            </p>
            <button
              type="button"
              onClick={() => setPresentationOpen(true)}
              disabled={busy}
              aria-label="발표 화면 열기"
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
      {cards
        .filter(({ group }) => group && group.winners.length >= 15)
        .map(({ code }) => (
          <PrizeFireworks key={code} prizeCode={code} />
        ))}
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

// 경품별로 한 번 마운트하여 명단의 반복 갱신에도 애니메이션을 재시작하지 않는다.
function PrizeFireworks({ prizeCode }: { prizeCode: string }) {
  const palettes = [
    ["#fff4bc", "#ffc34a", "#ff873d"],
    ["#ffffff", "#a5e8ff", "#d5b5ff"],
    ["#fff1c9", "#ff8baa", "#ffd66a"],
  ];
  return (
    <div
      className={styles.fireworks}
      aria-hidden="true"
      data-fireworks-prize={prizeCode}
    >
      {["left", "right"].map((side) => (
        <div
          key={side}
          className={`${styles.fireworksSide} ${side === "left" ? styles.fireworksLeft : styles.fireworksRight}`}
          data-fireworks-side={side}
        >
          {Array.from({ length: 3 }, (_, burst) => (
            <div
              key={burst}
              className={styles.fireworkBurst}
              style={
                {
                  "--burst-delay": `${burst * 0.85 + (side === "right" ? 0.12 : 0)}s`,
                  "--burst-x": `${[0, 5, -3][burst]}vw`,
                  "--burst-y": `${[0, 8, 2][burst]}vh`,
                } as CSSProperties
              }
            >
              <i className={styles.fireworkFlash} />
              <svg
                className={styles.fireworkTrails}
                viewBox="-360 -360 720 720"
                focusable="false"
              >
                {Array.from({ length: 64 }, (_, index) => {
                  const angle = (index / 64) * Math.PI * 2;
                  const radius = 190 + ((index * 37) % 110);
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const path = `M 0 0 C ${x * 0.45} ${y * 0.45} ${x * 0.9} ${y * 0.9} ${x} ${y + 85}`;
                  return (
                    <g
                      key={index}
                      style={
                        {
                          "--trail-delay": `${burst * 0.85 + (side === "right" ? 0.12 : 0) + (index % 4) * 0.025}s`,
                          "--trail-duration": `${2.1 + (index % 5) * 0.12}s`,
                          "--spark-color": palettes[burst][index % 3],
                        } as CSSProperties
                      }
                    >
                      <path
                        className={styles.fireworkTrail}
                        d={path}
                        pathLength={100}
                      />
                      <path
                        className={styles.fireworkEmbers}
                        d={path}
                        pathLength={100}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          ))}
        </div>
      ))}
    </div>
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
