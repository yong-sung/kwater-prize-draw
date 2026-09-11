import { describe, expect, it } from "vitest";

import {
  LoginRateLimiter,
  hashLoginIdentifier,
  type LoginAttempt,
  type LoginAttemptStore,
} from "./rate-limit";

class MemoryStore implements LoginAttemptStore {
  attempts = new Map<string, LoginAttempt>();

  async find(ipHash: string) {
    return this.attempts.get(ipHash) ?? null;
  }

  async recordFailure(ipHash: string, now: Date) {
    const previous = this.attempts.get(ipHash);
    if (previous?.blockedUntil && previous.blockedUntil > now) {
      return { blocked: true, blockedUntil: previous.blockedUntil };
    }
    const expired =
      !previous || now.getTime() - previous.createdAt.getTime() >= 600_000;
    const failures = expired ? 1 : previous.failures + 1;
    const blockedUntil =
      failures >= 5 ? new Date(now.getTime() + 900_000) : null;
    const attempt = {
      ipHash,
      failures,
      blockedUntil,
      createdAt: expired ? now : previous.createdAt,
      updatedAt: now,
    };
    this.attempts.set(attempt.ipHash, attempt);
    return blockedUntil ? { blocked: true, blockedUntil } : { blocked: false };
  }

  async remove(ipHash: string) {
    this.attempts.delete(ipHash);
  }
}

describe("관리자 로그인 제한", () => {
  it("IP 원문 대신 동일한 HMAC 해시를 사용한다", () => {
    const secret = "dummy-rate-hash-secret-32-bytes-long";
    const first = hashLoginIdentifier("192.0.2.10", secret);
    const second = hashLoginIdentifier("192.0.2.10", secret);

    expect(first).toBe(second);
    expect(first).not.toContain("192.0.2.10");
  });

  it("10분 안의 다섯 번째 실패부터 15분 동안 차단한다", async () => {
    const store = new MemoryStore();
    const limiter = new LoginRateLimiter(store);
    const start = new Date("2026-09-11T00:00:00.000Z");

    for (let count = 1; count <= 5; count += 1) {
      const result = await limiter.recordFailure("dummy-ip-hash", start);
      expect(result.blocked).toBe(count === 5);
    }

    await expect(
      limiter.check("dummy-ip-hash", new Date("2026-09-11T00:10:00.000Z")),
    ).resolves.toMatchObject({
      allowed: false,
      blockedUntil: new Date("2026-09-11T00:15:00.000Z"),
    });
  });

  it("실패 창이 지나면 초기화하고 성공하면 기록을 삭제한다", async () => {
    const store = new MemoryStore();
    const limiter = new LoginRateLimiter(store);
    await limiter.recordFailure(
      "dummy-ip-hash",
      new Date("2026-09-11T00:00:00.000Z"),
    );
    await limiter.recordFailure(
      "dummy-ip-hash",
      new Date("2026-09-11T00:11:00.000Z"),
    );

    expect(store.attempts.get("dummy-ip-hash")?.failures).toBe(1);
    await limiter.clear("dummy-ip-hash");
    expect(store.attempts.has("dummy-ip-hash")).toBe(false);
  });
});
