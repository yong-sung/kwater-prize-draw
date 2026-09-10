import { describe, expect, it } from "vitest";

import { decryptPii, encryptPii, hashAccessToken, hashPhone } from "./pii";

const encryptionKey = Buffer.alloc(32, 7).toString("base64");
const alternateKey = Buffer.alloc(32, 9).toString("base64");

describe("개인정보 암호화", () => {
  it("AES-256-GCM 암호화 값을 원문으로 복호화한다", () => {
    const plain = "테스트개인정보";
    expect(decryptPii(encryptPii(plain, encryptionKey), encryptionKey)).toBe(
      plain,
    );
  });

  it("같은 평문도 매번 다른 암호문을 만든다", () => {
    expect(encryptPii("동일평문", encryptionKey)).not.toBe(
      encryptPii("동일평문", encryptionKey),
    );
  });

  it.each([Buffer.alloc(31).toString("base64"), "잘못된-base64-키"])(
    "32바이트가 아닌 암호화 키를 거부한다",
    (invalidKey) => {
      expect(() => encryptPii("더미", invalidKey)).toThrow(
        "PII_ENCRYPTION_KEY는 32바이트여야 합니다",
      );
      expect(() => decryptPii("a.b.c", invalidKey)).toThrow(
        "PII_ENCRYPTION_KEY는 32바이트여야 합니다",
      );
    },
  );

  it("다른 정상 키로 복호화하지 못한다", () => {
    const encrypted = encryptPii("더미", encryptionKey);
    expect(() => decryptPii(encrypted, alternateKey)).toThrow();
  });

  it.each([1, 2])(
    "변조된 인증 태그 또는 암호문을 복호화하지 못한다",
    (partIndex) => {
      const parts = encryptPii("더미", encryptionKey).split(".");
      const bytes = Buffer.from(parts[partIndex], "base64url");
      bytes[0] ^= 1;
      parts[partIndex] = bytes.toString("base64url");
      expect(() => decryptPii(parts.join("."), encryptionKey)).toThrow();
    },
  );

  it("잘못된 암호문 형식을 거부한다", () => {
    expect(() => decryptPii("잘못된암호문", encryptionKey)).toThrow(
      "암호문 형식이 올바르지 않습니다",
    );
  });
});

describe("개인정보 HMAC", () => {
  it("같은 연락처와 Secret은 같은 해시를 만든다", () => {
    expect(hashPhone("01012345678", "dummy-secret-a")).toBe(
      hashPhone("01012345678", "dummy-secret-a"),
    );
  });

  it("입력이 다르면 다른 해시를 만든다", () => {
    expect(hashPhone("01012345678", "dummy-secret-a")).not.toBe(
      hashPhone("01087654321", "dummy-secret-a"),
    );
  });

  it("Secret이 다르면 다른 해시를 만든다", () => {
    expect(hashPhone("01012345678", "dummy-secret-a")).not.toBe(
      hashPhone("01012345678", "dummy-secret-b"),
    );
  });

  it("참석자 접근 토큰을 HMAC-SHA-256으로 해시한다", () => {
    const token = "dummy-access-token";
    const hash = hashAccessToken(token, "dummy-token-secret");
    expect(hash).toBe(hashAccessToken(token, "dummy-token-secret"));
    expect(hash).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hash).not.toContain(token);
  });
});
