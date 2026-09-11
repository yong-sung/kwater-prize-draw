// @vitest-environment node

import { afterAll, describe, expect, it } from "vitest";

import { createLoginRateLimiter, hashLoginIdentifier } from "./rate-limit";

const hasLocalSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY,
);
const ipHash = hasLocalSupabase
  ? hashLoginIdentifier(
      "192.0.2.44",
      "dummy-local-rate-limit-secret-32-bytes-long",
    )
  : "dummy-skipped-hash";

describe.runIf(hasLocalSupabase)("로그인 제한 Supabase 통합", () => {
  const limiter = createLoginRateLimiter();

  afterAll(async () => {
    await limiter.clear(ipHash);
  });

  it("IP HMAC 실패 기록을 저장·조회하고 성공 시 삭제한다", async () => {
    await limiter.clear(ipHash);
    await limiter.recordFailure(ipHash, new Date("2026-09-11T01:00:00.000Z"));
    await expect(
      limiter.check(ipHash, new Date("2026-09-11T01:01:00.000Z")),
    ).resolves.toEqual({ allowed: true });

    for (let count = 2; count <= 5; count += 1) {
      await limiter.recordFailure(
        ipHash,
        new Date("2026-09-11T01:0" + count + ":00.000Z"),
      );
    }
    await expect(
      limiter.check(ipHash, new Date("2026-09-11T01:06:00.000Z")),
    ).resolves.toMatchObject({ allowed: false });

    await limiter.clear(ipHash);
    await expect(
      limiter.check(ipHash, new Date("2026-09-11T01:06:00.000Z")),
    ).resolves.toEqual({ allowed: true });
  });

  it("동시에 발생한 다섯 번의 실패도 원자적으로 누적한다", async () => {
    await limiter.clear(ipHash);
    const now = new Date("2026-09-11T02:00:00.000Z");
    const results = await Promise.all(
      Array.from({ length: 5 }, () => limiter.recordFailure(ipHash, now)),
    );
    expect(results.filter((result) => result.blocked)).toHaveLength(1);
    await expect(limiter.check(ipHash, now)).resolves.toMatchObject({
      allowed: false,
    });
  });
});
