import { expect, test } from "@playwright/test";

const cases = [
  ["KEYBOARD", "기계식 키보드"],
  ["TUMBLER", "K-water 텀블러"],
  ["SCANNER", "카닥 라벨 에라"],
] as const;

for (const [prizeCode, prizeName] of cases) {
  test(`${prizeCode} 당첨 경품 이미지가 실제로 로드된다`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "kwater-prize-access-token",
        "playwright-test-token",
      );
    });
    await page.route("**/api/participants/result", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          state: "WINNER",
          name: "테스트 참가자",
          prizeCode,
          prizeName,
        }),
      });
    });

    await page.goto("/");
    const image = page.getByAltText(`${prizeName} 경품 사진`);
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate(
          (element) =>
            (element as HTMLImageElement).complete &&
            (element as HTMLImageElement).naturalWidth > 0,
        ),
      )
      .toBe(true);
  });
}
