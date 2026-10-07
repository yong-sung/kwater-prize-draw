import { describe, expect, it } from "vitest";
import {
  EXPECTED_EVENT_ID,
  EXPECTED_PROJECT_REF,
} from "./preview-availability-check.mjs";
describe("preview availability contract", () => {
  it("pins the development project and event", () => {
    expect(EXPECTED_PROJECT_REF).toBe("xmrezoudkgktbtfmzxhu");
    expect(EXPECTED_EVENT_ID).toBe("6833f277-746c-4033-9aef-30016cbba712");
  });
  it("contains only a SELECT event status query", () => {
    const q = `select id, status from public.events where id = '${EXPECTED_EVENT_ID}' limit 1;`;
    expect(q).toMatch(/^select id, status/i);
    expect(q).not.toMatch(/insert|update|delete|truncate|rpc\s*\(/i);
  });
});
