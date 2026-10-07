// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@/lib/security/admin-session", () => ({
  requireAdmin: mocks.requireAdmin,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: mocks.from, rpc: mocks.rpc }),
}));
import { POST } from "./route";
const eventId = "00000000-0000-4000-8000-000000000010";
const env = {
  NEXT_PUBLIC_SUPABASE_URL: "https://preview-project.supabase.co",
  VERCEL_ENV: "preview",
  ALLOW_REHEARSAL_RESET: "true",
  SUPABASE_PROJECT_ID: "preview-project",
  REHEARSAL_ALLOWED_SUPABASE_PROJECT_ID: "preview-project",
};
function request(
  body: object = {
    eventId,
    eventTitle: "가짜 리허설",
    confirmation: "리허설 초기화",
  },
) {
  return new Request("http://localhost/api/admin/rehearsal-reset", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
function event(title = "가짜 리허설") {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({
          data: { id: eventId, title, status: "PUBLISHED" },
          error: null,
        }),
      }),
    }),
  };
}
describe("리허설 초기화 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(process.env, env);
    mocks.requireAdmin.mockResolvedValue({ role: "admin" });
    mocks.from.mockReturnValue(event());
    mocks.rpc.mockResolvedValue({ data: { status: "OPEN" }, error: null });
  });
  it("Production이면 RPC 전에 거부한다", async () => {
    process.env.VERCEL_ENV = "production";
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("프로젝트 ID가 다르면 RPC 전에 거부한다", async () => {
    process.env.SUPABASE_PROJECT_ID = "other";
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("정확한 행사명과 확인 문구로 Preview 초기화를 실행한다", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("reset_rehearsal_event", {
      p_event_id: eventId,
      p_expected_title: "가짜 리허설",
    });
  });
  it("행사명이 다르면 RPC를 호출하지 않는다", async () => {
    const response = await POST(
      request({
        eventId,
        eventTitle: "다른 행사",
        confirmation: "리허설 초기화",
      }),
    );
    expect(response.status).toBe(409);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
