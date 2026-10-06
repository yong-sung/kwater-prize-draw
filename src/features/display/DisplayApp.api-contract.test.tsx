import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());
import DisplayApp from "./DisplayApp";

describe("DisplayApp API 계약", () => {
  it("display event/reveal API만 사용하고 admin reveal은 호출하지 않는다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "event-1",
            title: "행사",
            status: "DRAWN",
            groups: [],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            eventStatus: "REVEALING",
            prizeCode: null,
            groupComplete: true,
          }),
          {
            status: 200,
          },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<DisplayApp />);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/display/event", {
        cache: "no-store",
      }),
    );
    const button = await screen.findByRole("button", {
      name: /Enter로 다음 당첨자 공개/,
    });
    await button.click();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/display/reveal",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/admin/reveal",
      expect.anything(),
    );
  });
});
