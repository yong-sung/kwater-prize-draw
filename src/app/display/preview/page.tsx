"use client";

import RevealStage from "@/features/display/RevealStage";

// 디자인 확인용 가상 명단. 추첨 API와 연결하지 않는다.
const groups = [
  { prizeCode: "TUMBLER", prizeName: "스타벅스 텀블러" },
  { prizeCode: "SCANNER", prizeName: "코닥 라벨 에라 M50" },
  { prizeCode: "KEYBOARD", prizeName: "기계식 키보드" },
].map((prize) => ({
  ...prize,
  winners: Array.from({ length: 15 }, (_, index) => ({
    name: `이름 ${String(index + 1).padStart(2, "0")}`,
    department: [
      "기획조정실",
      "디지털혁신처",
      "수도관리처",
      "수자원관리처",
      "경영지원처",
    ][index % 5],
  })),
}));

export default function DisplayPreviewPage() {
  return (
    <RevealStage
      groups={groups}
      status="REVEALED"
      onReveal={() => undefined}
      busy={false}
    />
  );
}
