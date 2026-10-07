import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EntryForm from "./EntryForm";

describe("개인정보 동의 안내", () => {
  it("디자인 기준의 제한·항목·목적·보유기간을 모두 안내한다", () => {
    render(<EntryForm onSubmit={vi.fn()} />);
    expect(
      screen.getByText("동의하지 않을 경우, 설문 참여가 제한될 수 있습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("수집 및 이용하는 개인정보 항목: 이름, 연락처, 부서"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("수집 및 이용 목적: 참석자 사전조회 및 이벤트 진행"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("보유 및 이용기간: 당첨자 발표 후 1주일간 보관"),
    ).toBeInTheDocument();
  });
});
