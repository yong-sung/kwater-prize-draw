import { createHmac } from "node:crypto";

import { createServerClient } from "@/lib/supabase/server";

export type LoginAttempt = {
  ipHash: string;
  failures: number;
  blockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface LoginAttemptStore {
  find(ipHash: string): Promise<LoginAttempt | null>;
  recordFailure(
    ipHash: string,
    now: Date,
  ): Promise<{ blocked: boolean; blockedUntil?: Date }>;
  remove(ipHash: string): Promise<void>;
}

export type LoginRateLimitResult =
  { allowed: true } | { allowed: false; blockedUntil: Date };

export function hashLoginIdentifier(value: string, secret: string): string {
  if (new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("LOGIN_RATE_HASH_SECRET은 32바이트 이상이어야 합니다");
  }
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export class LoginRateLimiter {
  constructor(private readonly store: LoginAttemptStore) {}

  async check(ipHash: string, now = new Date()): Promise<LoginRateLimitResult> {
    const attempt = await this.store.find(ipHash);
    if (
      attempt?.blockedUntil &&
      attempt.blockedUntil.getTime() > now.getTime()
    ) {
      return { allowed: false, blockedUntil: attempt.blockedUntil };
    }
    return { allowed: true };
  }

  async recordFailure(
    ipHash: string,
    now = new Date(),
  ): Promise<{ blocked: boolean; blockedUntil?: Date }> {
    return this.store.recordFailure(ipHash, now);
  }

  async clear(ipHash: string): Promise<void> {
    await this.store.remove(ipHash);
  }
}

class SupabaseLoginAttemptStore implements LoginAttemptStore {
  async find(ipHash: string): Promise<LoginAttempt | null> {
    const { data, error } = await createServerClient()
      .from("admin_login_attempts")
      .select("ip_hash, failures, blocked_until, created_at, updated_at")
      .eq("ip_hash", ipHash)
      .maybeSingle();
    if (error) throw new Error("로그인 제한 상태를 확인할 수 없습니다");
    if (!data) return null;
    return {
      ipHash: data.ip_hash,
      failures: data.failures,
      blockedUntil: data.blocked_until ? new Date(data.blocked_until) : null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async recordFailure(ipHash: string, now: Date) {
    const { data, error } = await createServerClient().rpc(
      "record_admin_login_failure",
      { p_ip_hash: ipHash, p_now: now.toISOString() },
    );
    if (error) throw new Error("로그인 실패 상태를 저장할 수 없습니다");
    const result = Array.isArray(data) ? data[0] : data;
    if (!result || typeof result.blocked !== "boolean") {
      throw new Error("로그인 실패 상태 응답이 올바르지 않습니다");
    }
    return result.blocked
      ? { blocked: true, blockedUntil: new Date(result.blocked_until) }
      : { blocked: false };
  }

  async remove(ipHash: string): Promise<void> {
    const { error } = await createServerClient()
      .from("admin_login_attempts")
      .delete()
      .eq("ip_hash", ipHash);
    if (error) throw new Error("로그인 실패 상태를 초기화할 수 없습니다");
  }
}

export function createLoginRateLimiter(): LoginRateLimiter {
  return new LoginRateLimiter(new SupabaseLoginAttemptStore());
}
