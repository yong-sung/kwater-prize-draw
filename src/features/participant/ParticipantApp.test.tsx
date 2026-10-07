import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import ParticipantApp from "./ParticipantApp";

describe("참석자 모바일 화면", () => {
  let fetchMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchMock = vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("OPEN이면 네 개 필수 항목과 경품 응모 버튼을 표시한다", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "OPEN" }), { status: 200 }),
    );

    render(<ParticipantApp />);

    expect(await screen.findByLabelText(/참석자 성함/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/연락처 예시\(01012345678\)/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/연락처/i)).toHaveAttribute(
      "pattern",
      "^010\\d{8}$",
    );
    expect(screen.getByLabelText(/소속부서명/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/동의합니다/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/동의하지 않습니다/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /경품 응모/i }),
    ).toBeInTheDocument();
  });

  it("미동의 상태에서는 응모 버튼을 비활성화한다", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "OPEN" }), { status: 200 }),
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
        new Response(JSON.stringify({ status: "OPEN" }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ participantId: "dummy" }), {
          status: 201,
        }),
      );

    render(<ParticipantApp />);

    await screen.findByLabelText(/참석자 성함/i);
    await userEvent.type(screen.getByLabelText(/참석자 성함/i), "홍길동");
    await userEvent.type(screen.getByLabelText(/연락처/i), "01012345678");
    await userEvent.type(screen.getByLabelText(/소속부서명/i), "개발부");
    await userEvent.click(screen.getByLabelText(/동의합니다/i));

    await userEvent.click(screen.getByRole("button", { name: /경품 응모/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/participants",
      expect.any(Object),
    );

    expect(
      await screen.findByRole("heading", {
        name: "응모가 완료되었습니다! 해당 페이지를 종료하지 마세요.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("추첨은 행사 종료 직후 진행됩니다.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "해당 페이지와 강연장 화면에서 추첨 결과를 확인하실 수 있습니다.",
      ),
    ).toBeInTheDocument();
  });

  it("WINNER이면 행복한 방울이와 경품명을 표시한다", async () => {
    localStorage.setItem("kwater-prize-access-token", "dummy-token");

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          state: "WINNER",
          name: "홍길동",
          prizeCode: "TUMBLER",
          prizeName: "스마트 텀블러",
        }),
        { status: 200 },
      ),
    );

    render(<ParticipantApp />);

    expect(await screen.findByAltText("행복해하는 방울이")).toBeInTheDocument();
    expect(screen.getByText(/스마트 텀블러/)).toBeInTheDocument();
    expect(screen.getByText(/당첨/)).toBeInTheDocument();
  });

  it("NOT_WINNER이면 슬퍼하는 방울이와 꽝 문구를 표시한다", async () => {
    localStorage.setItem("kwater-prize-access-token", "dummy-token");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ state: "NOT_WINNER", name: "홍길동" }), {
        status: 200,
      }),
    );

    render(<ParticipantApp />);

    expect(await screen.findByAltText("슬퍼하는 방울이")).toBeInTheDocument();
    expect(screen.getByText(/아쉽지만/)).toBeInTheDocument();
  });

  it("미응모 상태에서 CLOSED이면 마감 화면을 표시한다", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "CLOSED" }), { status: 200 }),
    );

    render(<ParticipantApp />);

    expect(
      await screen.findByText(/응모가 마감되었습니다/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /경품 응모/i }),
    ).not.toBeInTheDocument();
  });
  it("행사 조회 실패를 숨기지 않고 재시도 안내를 표시한다", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: "SUPABASE_CONFIG_ERROR" }), {
        status: 500,
      }),
    );

    render(<ParticipantApp />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "행사 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  });
  it("행사 조회가 시간 안에 끝나지 않으면 로딩 대신 오류를 표시한다", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          (init?.signal as AbortSignal | undefined)?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );

    render(<ParticipantApp />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "행사 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  });
});
