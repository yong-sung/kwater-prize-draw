import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DisplayApp from "./DisplayApp";

describe("DisplayApp", () => {
  it("怨듦컻 ?붾㈃ 而댄룷?뚰듃瑜??쒓났?쒕떎", async () => {
    const imported = await import("./DisplayApp").catch(() => null);
    expect(imported).not.toBeNull();
  });
});

it("PUBLISHED 행사에 직접 진입하면 공개 결과와 완료 문구를 복원한다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "event-1",
          title: "행사",
          description: "",
          venue: "",
          startsAt: null,
          status: "PUBLISHED",
          participantCount: 1,
          privacy: { items: [], purpose: "", retentionDays: 7 },
          groups: [
            {
              prizeCode: "TUMBLER",
              prizeName: "텀블러",
              winners: [{ name: "홍길동", department: "개발팀" }],
            },
          ],
        }),
        { status: 200 },
      ),
    ),
  );
  render(<DisplayApp />);
  await waitFor(() => expect(screen.getByText("홍길동")).toBeInTheDocument());
  expect(screen.getByText("모든 당첨자 공개 완료")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /다음 당첨자 공개/ }),
  ).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalledWith(
    "/api/admin/reveal",
    expect.anything(),
  );
});

it("REVEALED 행사에 직접 진입하면 공개 결과와 완료 문구를 복원한다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "event-1",
          title: "행사",
          description: "",
          venue: "",
          startsAt: null,
          status: "REVEALED",
          participantCount: 1,
          privacy: { items: [], purpose: "", retentionDays: 7 },
          groups: [
            {
              prizeCode: "TUMBLER",
              prizeName: "텀블러",
              winners: [{ name: "홍길동", department: "개발팀" }],
            },
          ],
        }),
        { status: 200 },
      ),
    ),
  );
  render(<DisplayApp />);
  await waitFor(() => expect(screen.getByText("홍길동")).toBeInTheDocument());
  expect(screen.getByText("모든 당첨자 공개 완료")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /다음 당첨자 공개/ }),
  ).not.toBeInTheDocument();
});

it("DRAWN 행사에 직접 진입하면 공개 시작 동작을 유지한다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "event-1",
          title: "행사",
          description: "",
          venue: "",
          startsAt: null,
          status: "DRAWN",
          participantCount: 1,
          privacy: { items: [], purpose: "", retentionDays: 7 },
          groups: [],
        }),
        { status: 200 },
      ),
    ),
  );
  render(<DisplayApp />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /다음 당첨자 공개/ }),
    ).toBeInTheDocument(),
  );
  expect(
    screen.getByRole("button", { name: /다음 당첨자 공개/ }),
  ).toBeEnabled();
});

it("강연장 로딩 문구를 정상 한국어로 표시한다", () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {})),
  );
  render(<DisplayApp />);
  expect(screen.getByText("행사 정보를 불러오는 중…")).toBeInTheDocument();
});

it("행사 조회 실패를 정상 한국어로 안내한다", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
  );
  render(<DisplayApp />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "행사 정보를 불러오지 못했습니다.",
  );
});
