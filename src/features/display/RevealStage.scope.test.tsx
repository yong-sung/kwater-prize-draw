import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import RevealStage from "./RevealStage";

it("추첨 전 화면에는 이미지와 레버만 표시하고 완료 문구를 숨긴다", () => {
  render(
    <RevealStage
      groups={[]}
      status="DRAWN"
      onReveal={() => undefined}
      busy={false}
    />,
  );
  expect(screen.getByLabelText("레버 추첨 장식")).toBeInTheDocument();
  expect(screen.queryByText("모든 당첨자 공개 완료")).not.toBeInTheDocument();
});

it("공개가 시작된 화면은 기존 결과 UI를 사용한다", () => {
  render(
    <RevealStage
      groups={[]}
      status="REVEALING"
      nextPrizeName="텀블러"
      onReveal={() => undefined}
      busy={false}
    />,
  );
  expect(screen.queryByLabelText("레버 추첨 장식")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "텀블러 추첨 시작" }),
  ).toBeInTheDocument();
});

it("완료 화면에는 대기 화면 이미지를 적용하지 않는다", () => {
  render(
    <RevealStage
      groups={[]}
      status="PUBLISHED"
      onReveal={() => undefined}
      busy={false}
    />,
  );
  expect(screen.queryByLabelText("레버 추첨 장식")).not.toBeInTheDocument();
  expect(screen.getByText("모든 당첨자 공개 완료")).toBeInTheDocument();
});
