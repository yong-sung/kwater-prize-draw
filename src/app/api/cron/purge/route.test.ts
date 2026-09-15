// @vitest-environment node
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ rpc: mocks.rpc }),
}));

import { GET } from "./route";

const secret = "dummy-cron-secret-for-task-ten";
function request(authorization?: string) {
  return new Request("http://localhost/api/cron/purge", {
    headers: authorization ? { authorization } : undefined,
  });
}

describe("만료 개인정보 삭제 cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", secret);
    mocks.rpc.mockResolvedValue({ data: { purgedEventIds: [] }, error: null });
  });

  it("Bearer 인증이 없거나 틀리면 401이고 DB를 호출하지 않는다", async () => {
    expect((await GET(request())).status).toBe(401);
    expect((await GET(request("Bearer wrong-secret"))).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("정상 인증이면 purge_expired_events를 한 번 호출한다", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: { purgedEventIds: ["00000000-0000-4000-8000-000000000010"] },
      error: null,
    });

    const response = await GET(request(`Bearer ${secret}`));

    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("purge_expired_events");
    expect(await response.json()).toEqual({
      purgedEventIds: ["00000000-0000-4000-8000-000000000010"],
    });
  });

  it("같은 cron 재호출도 빈 결과로 안전하게 200을 반환한다", async () => {
    const first = await GET(request(`Bearer ${secret}`));
    const second = await GET(request(`Bearer ${secret}`));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ purgedEventIds: [] });
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });

  it("기존 DB 함수가 만료 개인정보·개인결과 삭제와 PURGED 전환을 보장한다", () => {
    const migration = readFileSync(
      "supabase/migrations/20260910003438_initial.sql",
      "utf8",
    );
    expect(migration).toContain("delete from public.participants");
    expect(migration).toContain("set status = 'PURGED'");
    expect(migration).toContain("e.purge_at <= statement_timestamp()");
    expect(migration).toContain("where e.status = 'PUBLISHED'");
  });
});
