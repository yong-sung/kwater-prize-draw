import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminLogin } from "./AdminLogin";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("관리자 로그인", () => {
  it("비밀번호를 POST하고 성공 콜백을 호출한다", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<AdminLogin onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("관리자 비밀번호"), "dummy-secret");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("인증 실패 메시지를 표시하고 비밀번호를 화면에 남기지 않는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "INVALID_CREDENTIALS",
            error: "비밀번호를 확인해 주세요.",
          }),
          { status: 401, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<AdminLogin />);

    const input = screen.getByLabelText("관리자 비밀번호");
    await user.type(input, "wrong-dummy");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "비밀번호를 확인해 주세요.",
    );
    expect(input).toHaveValue("");
  });

  it("차단 응답에 남은 시간을 표시하고 버튼을 잠근다", async () => {
    const blockedUntil = new Date(Date.now() + 30_000).toISOString();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "LOGIN_BLOCKED",
            error: "잠시 후 다시 시도해 주세요.",
            blockedUntil,
          }),
          { status: 429, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<AdminLogin />);

    await user.type(screen.getByLabelText("관리자 비밀번호"), "dummy");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("30초");
    expect(screen.getByRole("button", { name: "로그인" })).toBeDisabled();
  });
});
