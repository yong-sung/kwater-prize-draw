import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`관리자 대시보드 ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    let status = "OPEN";
    await page.route("**/api/auth/login", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      }),
    );
    await page.route("**/api/admin/event", async (route) => {
      if (route.request().method() === "PATCH") {
        const body = route.request().postDataJSON();
        status = body.status ?? status;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            event: {
              id: "00000000-0000-4000-8000-000000000001",
              name: body.title ?? "더미 행사",
              status,
            },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          event: {
            id: "00000000-0000-4000-8000-000000000001",
            name: "더미 행사",
            status,
          },
          participants: 1,
          prizes: 1,
        }),
      });
    });
    await page.route("**/api/admin/participants", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          participants: [
            { id: "p1", event_id: "e1", department: "테스트부서" },
          ],
        }),
      }),
    );
    await page.route("**/api/admin/results**", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: "r1",
              participantId: "p1",
              prize: { name: "테스트 경품", code: "A" },
              unawarded: false,
            },
          ],
        }),
      }),
    );
    await page.route("**/api/admin/draw", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ winnerCount: 1 }),
      }),
    );
    await page.route("**/api/admin/publish", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ published: true }),
      }),
    );
    await page.goto("/admin");
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await page
      .locator('input[type="password"]')
      .pressSequentially("dummy-password");
    await expect(page.locator('input[type="password"]')).toHaveValue(
      "dummy-password",
    );
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("더미 행사")).toBeVisible();
    await expect(page.getByText("테스트부서")).toBeVisible();
    await expect(page.getByText("테스트 경품")).toBeVisible();
    await page.screenshot({
      path: `test-results/admin-${viewport.width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width);
  });
}
