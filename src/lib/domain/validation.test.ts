import { describe, expect, it } from "vitest";

import { normalizePhone, participantSchema } from "./validation";

const validParticipant = {
  name: "테스트참석자",
  phone: "01012345678",
  department: "테스트부서",
  privacyConsent: true,
  accessToken: "a".repeat(43),
} as const;

describe("normalizePhone", () => {
  it("연락처에서 하이픈과 공백을 제거한다", () => {
    expect(normalizePhone("010-1234 5678")).toBe("01012345678");
  });
});

describe("participantSchema", () => {
  it("유효한 휴대전화 번호를 정규화해 허용한다", () => {
    expect(
      participantSchema.parse({ ...validParticipant, phone: "010-1234-5678" })
        .phone,
    ).toBe("01012345678");
  });

  it.each(["02-1234-5678", "010-123-456", "010-1234-567a"])(
    "잘못된 연락처 %s를 거부한다",
    (phone) => {
      expect(() =>
        participantSchema.parse({ ...validParticipant, phone }),
      ).toThrow();
    },
  );

  it("개인정보 미동의를 거부한다", () => {
    expect(() =>
      participantSchema.parse({ ...validParticipant, privacyConsent: false }),
    ).toThrow();
  });

  it.each([" ", "한", "가".repeat(31)])(
    "잘못된 성명 길이를 거부한다",
    (name) => {
      expect(() =>
        participantSchema.parse({ ...validParticipant, name }),
      ).toThrow();
    },
  );

  it("성명의 바깥 공백을 제거한다", () => {
    expect(
      participantSchema.parse({ ...validParticipant, name: "  테스트  " }).name,
    ).toBe("테스트");
  });

  it.each([" ", "부", "가".repeat(61)])(
    "잘못된 소속부서 길이를 거부한다",
    (department) => {
      expect(() =>
        participantSchema.parse({ ...validParticipant, department }),
      ).toThrow();
    },
  );

  it("소속부서의 바깥 공백을 제거한다", () => {
    expect(
      participantSchema.parse({
        ...validParticipant,
        department: "  테스트부서  ",
      }).department,
    ).toBe("테스트부서");
  });

  it.each(["짧은토큰", "a".repeat(129)])(
    "허용 길이를 벗어난 행사 접근 토큰을 거부한다",
    (accessToken) => {
      expect(() =>
        participantSchema.parse({ ...validParticipant, accessToken }),
      ).toThrow();
    },
  );
});
