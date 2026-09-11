import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import ParticipantApp from "./ParticipantApp";

describe("참석자 모바일 화면", () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("OPEN이면 네 개 필수 항목과 경품 응모 버튼을 표시한다", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "OPEN" }), { status: 200 })
    );

    render(<ParticipantApp />);

    expect(await screen.findByLabelText(/참석자 성함/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/연락처 \(010-0000-0000\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/소속부서명/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/동의합니다/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/동의하지 않습니다/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /경품 응모/i })).toBeInTheDocument();
  });

  it("미동의 상태에서는 응모 버튼을 비활성화한다", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "OPEN" }), { status: 200 })
    );

    render(<ParticipantApp />);

    const button = await screen.findByRole("button", { name: /경품 응모/i });
    expect(button).toBeDisabled();

    // 동의합니다 클릭 시 활성화 확인
    const agreeRadio = screen.getByLabelText(/동의합니다/i);
    await userEvent.click(agreeRadio);
    expect(button).toBeEnabled();
    
    // 동의하지 않습니다 클릭 시 비활성화 확인
    const disagreeRadio = screen.getByLabelText(/동의하지 않습니다/i);
    await userEvent.click(disagreeRadio);
    expect(button).toBeDisabled();
  });

  it("응모 성공 후 대기 화면을 표시한다", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "OPEN" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ participantId: "dummy" }), { status: 201 })
      );

    render(<ParticipantApp />);

    await screen.findByLabelText(/참석자 성함/i);
    await userEvent.type(screen.getByLabelText(/참석자 성함/i), "홍길동");
    await userEvent.type(screen.getByLabelText(/연락처/i), "010-1234-5678");
    await userEvent.type(screen.getByLabelText(/소속부서명/i), "개발부");
    await userEvent.click(screen.getByLabelText(/동의합니다/i));
    
    await userEvent.click(screen.getByRole("button", { name: /경품 응모/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/participants", expect.any(Object));
    
    expect(await screen.findByText(/응모가 완료되었습니다/i)).toBeInTheDocument();
  });

  it("WINNER이면 행복한 방울이와 경품명을 표시한다", async () => {
    localStorage.setItem("kwater-prize-access-token", "dummy-token");
    
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ state: "WINNER", name: "홍길동", prizeName: "스마트 텀블러" }), 
        { status: 200 }
      )
    );

    render(<ParticipantApp />);

    expect(await screen.findByAltText("기뻐하는 방울이")).toBeInTheDocument();
    expect(screen.getByText(/스마트 텀블러/)).toBeInTheDocument();
    expect(screen.getByText(/당첨/)).toBeInTheDocument();
  });

  it("NOT_WINNER이면 슬퍼하는 방울이와 꽝 문구를 표시한다", async () => {
    localStorage.setItem("kwater-prize-access-token", "dummy-token");
    
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ state: "NOT_WINNER", name: "홍길동" }), 
        { status: 200 }
      )
    );

    render(<ParticipantApp />);

    expect(await screen.findByAltText("슬퍼하는 방울이")).toBeInTheDocument();
    expect(screen.getByText(/아쉽지만/)).toBeInTheDocument();
  });

  it("미응모 상태에서 CLOSED이면 마감 화면을 표시한다", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "CLOSED" }), { status: 200 })
    );

    render(<ParticipantApp />);

    expect(await screen.findByText(/응모가 마감되었습니다/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /경품 응모/i })).not.toBeInTheDocument();
  });
});
