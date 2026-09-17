import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RevealStage from "./RevealStage";

describe("RevealStage", () => {
  it("REVEALED 상태에서는 완료 문구를 표시하고 다음 공개 버튼을 제공하지 않는다", () => {
    render(
      <RevealStage
        groups={[]}
        status="REVEALED"
        onReveal={() => undefined}
        busy={false}
      />,
    );
    expect(screen.getByText("모든 당첨자 공개 완료")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /다음 당첨자 공개/ }),
    ).not.toBeInTheDocument();
  });
});

it("PUBLISHED 상태도 완료 문구를 표시하고 공개 버튼을 숨긴다", () => {
  render(
    <RevealStage
      groups={[]}
      status="PUBLISHED"
      onReveal={() => undefined}
      busy={false}
    />,
  );
  expect(screen.getByText("모든 당첨자 공개 완료")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
