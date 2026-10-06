import { describe, expect, it, vi } from "vitest";
import { revealPrizeGroup } from "./revealPrizeGroup";

describe("경품 그룹 순차 공개", () => {
  it("첫 당첨자를 공개한 뒤 같은 경품을 0.5초 간격으로 요청하고 그룹 경계에서 멈춘다", async () => {
    const reveal = vi
      .fn()
      .mockResolvedValueOnce({
        eventStatus: "REVEALING",
        prizeCode: "KEYBOARD",
        groupComplete: false,
      })
      .mockResolvedValueOnce({
        eventStatus: "REVEALING",
        prizeCode: "KEYBOARD",
        groupComplete: false,
      })
      .mockResolvedValueOnce({
        eventStatus: "REVEALING",
        prizeCode: "KEYBOARD",
        groupComplete: true,
      });
    const wait = vi.fn().mockResolvedValue(undefined);
    const refresh = vi.fn().mockResolvedValue(undefined);

    await revealPrizeGroup({ reveal, refresh, wait });

    expect(reveal).toHaveBeenNthCalledWith(1, null);
    expect(reveal).toHaveBeenNthCalledWith(2, "KEYBOARD");
    expect(reveal).toHaveBeenNthCalledWith(3, "KEYBOARD");
    expect(wait).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenNthCalledWith(1, 500);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("마지막 당첨자 공개로 행사가 REVEALED가 되면 추가 요청하지 않는다", async () => {
    const reveal = vi.fn().mockResolvedValue({
      eventStatus: "REVEALED",
      prizeCode: "SCANNER",
      groupComplete: false,
    });
    const refresh = vi.fn().mockResolvedValue(undefined);

    await revealPrizeGroup({
      reveal,
      refresh,
      wait: vi.fn().mockResolvedValue(undefined),
    });

    expect(reveal).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
