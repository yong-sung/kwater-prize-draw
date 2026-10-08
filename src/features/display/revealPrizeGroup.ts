export type RevealStep = {
  eventStatus: string;
  prizeCode: string | null;
  groupComplete: boolean;
};

type RevealPrizeGroupOptions = {
  reveal: (expectedPrizeCode: string | null) => Promise<RevealStep>;
  refresh: () => void | Promise<void>;
  wait?: (milliseconds: number) => Promise<void>;
};

const defaultWait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

export async function revealPrizeGroup({
  reveal,
  refresh,
  wait = defaultWait,
}: RevealPrizeGroupOptions): Promise<void> {
  let expectedPrizeCode: string | null = null;

  while (true) {
    const step = await reveal(expectedPrizeCode);
    if (step.groupComplete) return;

    await refresh();
    if (step.eventStatus === "REVEALED" || !step.prizeCode) return;

    expectedPrizeCode = step.prizeCode;
    await wait(200);
  }
}
