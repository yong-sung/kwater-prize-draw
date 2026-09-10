import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Supabase 클라이언트 환경변수 계약", () => {
  it("서버 Secret이 없으면 서버 클라이언트 생성을 거부한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://dummy-project.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const { createServerClient } = await import("./server");

    expect(() => createServerClient()).toThrow(
      "Supabase 서버 Secret이 필요합니다",
    );
  });

  it("publishable key가 없으면 브라우저 클라이언트 생성을 거부한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://dummy-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const { createRealtimeClient } = await import("./browser");

    expect(() => createRealtimeClient()).toThrow(
      "Supabase 브라우저 publishable key가 필요합니다",
    );
  });

  it("새 키 체계로 서버와 브라우저 클라이언트를 생성한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://dummy-project.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "dummy-server-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "dummy-publishable-key");
    const [{ createServerClient }, { createRealtimeClient }] =
      await Promise.all([import("./server"), import("./browser")]);

    expect(createServerClient().auth).toBeDefined();
    expect(createRealtimeClient().realtime).toBeDefined();
  });
});
