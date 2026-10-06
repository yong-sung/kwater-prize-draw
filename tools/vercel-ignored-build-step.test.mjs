import { describe, expect, it } from "vitest";
import {
  changedFiles,
  main,
  shouldBuild,
} from "./vercel-ignored-build-step.mjs";
const prod = {
  VERCEL_ENV: "production",
  VERCEL_GIT_PREVIOUS_SHA: "before",
  VERCEL_GIT_COMMIT_SHA: "after",
};
const preview = {
  VERCEL_ENV: "preview",
  VERCEL_GIT_PREVIOUS_SHA: "before",
  VERCEL_GIT_COMMIT_SHA: "after",
};
const runnerFor =
  (stdout, status = 0) =>
  () => ({ status, stdout, stderr: status ? "diff failed" : "" });
describe("Vercel Ignored Build Step", () => {
  it("Preview는 모니터링 파일만 변경돼도 빌드한다", () =>
    expect(
      main(preview, runnerFor("tools/preview-availability-check.mjs\n")),
    ).toBe(1));
  it("Production은 허용된 정확한 모니터링 파일만 변경되면 생략한다", () =>
    expect(
      main(
        prod,
        runnerFor(
          "tools/preview-availability-check.mjs\ntools/preview-availability-check.test.mjs\ntools/preview-availability-contract.test.mjs",
        ),
      ),
    ).toBe(0));
  it("허용되지 않은 앱 파일이 하나라도 있으면 빌드한다", () =>
    expect(
      main(
        prod,
        runnerFor("tools/preview-availability-check.mjs\nsrc/app/page.tsx"),
      ),
    ).toBe(1));
  it("이전 SHA 누락이면 빌드한다", () =>
    expect(
      main(
        { VERCEL_ENV: "production", VERCEL_GIT_COMMIT_SHA: "after" },
        runnerFor(""),
      ),
    ).toBe(1));
  it("현재 SHA 누락이면 빌드한다", () =>
    expect(
      main(
        { VERCEL_ENV: "production", VERCEL_GIT_PREVIOUS_SHA: "before" },
        runnerFor(""),
      ),
    ).toBe(1));
  it("git diff 오류면 빌드한다", () =>
    expect(main(prod, runnerFor("", 1))).toBe(1));
  it("git diff 출력 파싱 오류면 빌드한다", () =>
    expect(
      main(prod, runnerFor("tools/preview-availability-check.mjs\n\u0000bad")),
    ).toBe(1));
  it("tools 또는 docs의 무관한 파일 변경이면 빌드한다", () =>
    expect(main(prod, runnerFor("tools/other.mjs\ndocs/readme.md"))).toBe(1));
  it("정확한 허용 목록 외 파일은 shouldBuild에서 빌드 대상으로 판정한다", () =>
    expect(shouldBuild(["tools/other.mjs"])).toBe(true));
  it("정상적인 diff 출력은 파일 목록으로 파싱한다", () =>
    expect(
      changedFiles("before", "after", runnerFor("src/app/page.tsx\n")),
    ).toEqual(["src/app/page.tsx"]));
});
