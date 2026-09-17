# K-water 寃쏀뭹異붿꺼 ??Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** QR ?묐え, ?쒕쾭 異붿꺼, 媛뺤뿰???쒖감 怨듦컻, 媛쒖씤 寃곌낵 怨듭쑀, 7????媛쒖씤?뺣낫 ??젣瑜?吏?먰븯???⑥씪 ?됱궗 ?ъ궗?⑺삎 ?뱀쓣 援ъ텞?쒕떎.

**Architecture:** Next.js App Router媛 李몄꽍?먃룰컯?곗옣쨌愿由ъ옄 ?붾㈃怨??쒕쾭 Route Handler瑜??쒓났?섍퀬 Vercel??諛고룷?쒕떎. Supabase Postgres???됱궗 ?곹깭? ?뷀샇??媛쒖씤?뺣낫 諛?異붿꺼 寃곌낵瑜???ν븯硫? 誘쇨컧??蹂寃쎌? PostgreSQL ?⑥닔? ?쒕쾭 ?꾩슜 API?먯꽌留??ㅽ뻾?쒕떎. ?ㅼ떆媛??뚮┝? 媛쒖씤?뺣낫瑜??ｌ? ?딄퀬 ?곹깭 蹂寃??ъ떎留??꾨떖?섎ŉ 媛??붾㈃? ?뚮┝ ?섏떊 ??沅뚰븳??留욌뒗 API瑜??ㅼ떆 議고쉶?쒕떎.

**Tech Stack:** Node.js 20.9 ?댁긽, Next.js App Router, TypeScript, Tailwind CSS, Supabase Postgres/Realtime, Zod, jose, bcryptjs, Vitest, Testing Library, Playwright, k6, Vercel

**Spec:** docs/superpowers/specs/2026-09-09-prize-draw-web-design.md

## Global Constraints

- ?묒꽦 臾몄꽌, ?붾㈃ 臾멸뎄, 二쇱꽍? ?쒓뎅?대? 湲곕낯?쇰줈 ?쒕떎.
- ??踰덉뿉 ?섎굹???됱궗留??쒖꽦?뷀븳??
- ?됱궗 湲곕낯 寃쏀뭹? ?ㅼ틪湲곌린 10媛? ?釉붾윭 10媛? ?ㅻ낫??10媛쒕떎.
- ??李몄꽍?먮뒗 理쒕? ??媛쒖쓽 寃쏀뭹留?諛쏆쓣 ???덈떎.
- ?곕씫泥?湲곗??쇰줈 ?됱궗????踰덈쭔 ?묐え?????덈떎.
- 異붿꺼? ?묐え 留덇컧 ???쒕쾭?먯꽌 ??踰덈쭔 ?ㅽ뻾?섍퀬 ?꾩껜 ?ъ텛泥⑥쓣 ?쒓났?섏? ?딅뒗??
- 諛쒗몴 ?쒖꽌???ㅼ틪湲곌린, ?釉붾윭, ?ㅻ낫?쒕떎.
- 寃곌낵 怨듭쑀 ?꾩뿉??媛쒖씤 ?뱀꺼 ?щ?瑜?諛섑솚?섏? ?딅뒗??
- 媛쒖씤?뺣낫? 媛쒖씤蹂?寃곌낵??寃곌낵 怨듭쑀 ?쒓컖?쇰줈遺??7??????젣?쒕떎.
- ?대쫫, ?곕씫泥? 遺?쒕뒗 ?쒕쾭?먯꽌 ?뷀샇?뷀빐 ??ν븯怨?濡쒓렇???④린吏 ?딅뒗??
- 李몄꽍???붾㈃? iPhone Safari, Android Chrome, ?쇱꽦 ?명꽣?룹쓣 吏?먰븳??
- 媛뺤뿰???붾㈃? Chrome 16:9 ?꾩껜?붾㈃怨??ㅻ낫??Enter 議곗옉??吏?먰븳??
- 500紐?吏묒쨷 ?묐え?먯꽌 ?꾨씫쨌以묐났쨌以묐났 ?뱀꺼???놁뼱???쒕떎.
- 紐⑤뱺 湲곕뒫? ?뚯뒪???곗꽑?쇰줈 援ы쁽?섍퀬 ?묒뾽蹂꾨줈 而ㅻ컠?쒕떎.

---

## 1. ??怨꾪쉷???ъ슜 ?쒖꽌

1. ?ㅺ퀎?쒖? ??怨꾪쉷?쒕? ?꾨줈?앺듃??docs/superpowers ?붾젆?곕━???붾떎.
2. ?ㅼ꽢 媛?湲곗? ?대?吏瑜?context/design-reference ?붾젆?곕━???붾떎.
3. ??諛⑹슱??PNG瑜?public/images???곷Ц ?뚯씪紐낆쑝濡?蹂듭궗?쒕떎.
4. Codex????踰덉뿉 ?꾩껜 援ы쁽???붿껌?섏? 留먭퀬 ?꾨옒 Task瑜??섎굹???붿껌?쒕떎.
5. 媛?Task???뚯뒪??寃곌낵? 蹂寃??뚯씪??寃?좏븯怨?而ㅻ컠?????ㅼ쓬 Task濡??대룞?쒕떎.
6. ?댁쁺 諛고룷??Preview 寃利?寃곌낵瑜??뺤씤????蹂꾨룄 ?뱀씤?쒕떎.

## 2. 紐⑺몴 ?뚯씪 援ъ“

~~~text
kwater-prize-draw/
?쒋? AGENTS.md
?쒋? context/design-reference/
?? ?쒋? IMG_4893.png
?? ?쒋? IMG_4894.png
?? ?쒋? IMG_4895.png
?? ?쒋? ?됰났?댄븯??諛⑹슱??png
?? ?붴? ?ы띁?섎뒗 諛⑹슱??png
?쒋? docs/superpowers/
?? ?쒋? specs/2026-09-09-prize-draw-web-design.md
?? ?붴? plans/2026-09-09-prize-draw-web-implementation.md
?쒋? public/images/
?? ?쒋? bangwool-happy.png
?? ?붴? bangwool-sad.png
?쒋? src/
?? ?쒋? app/
?? ?? ?쒋? page.tsx
?? ?? ?쒋? display/page.tsx
?? ?? ?쒋? admin/page.tsx
?? ?? ?붴? api/
?? ?쒋? features/
?? ?? ?쒋? participant/
?? ?? ?쒋? admin/
?? ?? ?붴? display/
?? ?쒋? lib/
?? ?? ?쒋? domain/
?? ?? ?쒋? security/
?? ?? ?쒋? supabase/
?? ?? ?붴? realtime/
?? ?붴? test/
?쒋? supabase/migrations/202609090001_initial.sql
?쒋? tests/e2e/
?쒋? tests/load/
?쒋? .env.example
?쒋? vitest.config.ts
?쒋? playwright.config.ts
?붴? vercel.json
~~~

---

### Task 1: ?꾨줈?앺듃 湲곕컲怨?媛쒕컻 怨꾩빟

**Files:**
- Create: ?꾩껜 Next.js ?꾨줈?앺듃
- Create: AGENTS.md
- Create: .env.example
- Create: vitest.config.ts
- Create: src/test/setup.ts
- Modify: package.json
- Test: src/app/page.test.tsx

**Interfaces:**
- Consumes: ?놁쓬
- Produces: npm run test:run, npm run typecheck, npm run lint, npm run build 紐낅졊怨?@/* 寃쎈줈 蹂꾩묶

- [ ] **Step 1: ?꾨줈?앺듃瑜??앹꽦?섍퀬 ?섏〈?깆쓣 ?ㅼ튂?쒕떎**

~~~bash
npx create-next-app@latest kwater-prize-draw --ts --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*"
cd kwater-prize-draw
npm install @supabase/supabase-js zod jose bcryptjs qrcode.react
npm install -D vitest jsdom @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test supabase
~~~

Expected: npm run dev濡?湲곕낯 Next.js ?붾㈃???대━怨??ㅼ튂 ?ㅻ쪟媛 ?녿떎.

- [ ] **Step 2: ?섍꼍蹂??怨꾩빟???묒꽦?쒕떎**

Create .env.example:

~~~dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD_HASH=BCRYPT_HASH
ADMIN_SESSION_SECRET=AT_LEAST_32_RANDOM_BYTES_BASE64URL
PII_ENCRYPTION_KEY=32_RANDOM_BYTES_BASE64
PHONE_HASH_SECRET=AT_LEAST_32_RANDOM_BYTES_BASE64URL
PARTICIPANT_TOKEN_HASH_SECRET=AT_LEAST_32_RANDOM_BYTES_BASE64URL
LOGIN_RATE_HASH_SECRET=AT_LEAST_32_RANDOM_BYTES_BASE64URL
CRON_SECRET=AT_LEAST_32_RANDOM_BYTES_BASE64URL
~~~

- [ ] **Step 3: ?뚯뒪???ㅼ젙怨??ㅽ뙣?섎뒗 泥??붾㈃ ?뚯뒪?몃? ?묒꽦?쒕떎**

Create vitest.config.ts:

~~~ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./src/test/setup.ts"] },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
~~~

Create src/test/setup.ts:

~~~ts
import "@testing-library/jest-dom/vitest";
~~~

Create src/app/page.test.tsx:

~~~tsx
import { render, screen } from "@testing-library/react";
import Home from "./page";

it("K-water 寃쏀뭹異붿꺼 ?쒕ぉ???쒖떆?쒕떎", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: "K-water 寃쏀뭹異붿꺼" })).toBeInTheDocument();
});
~~~

- [ ] **Step 4: ?뚯뒪?몃? ?ㅽ뻾???ㅽ뙣瑜??뺤씤?쒕떎**

Run: npx vitest run src/app/page.test.tsx

Expected: ?쒕ぉ??李얠? 紐삵빐 FAIL.

- [ ] **Step 5: 理쒖냼 泥??붾㈃怨?npm ?ㅽ겕由쏀듃瑜?異붽??쒕떎**

Replace src/app/page.tsx:

~~~tsx
export default function Home() {
  return <h1>K-water 寃쏀뭹異붿꺼</h1>;
}
~~~

Add these scripts to package.json without deleting the existing scripts:

~~~json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:e2e": "playwright test",
  "typecheck": "tsc --noEmit"
}
~~~

- [ ] **Step 6: AGENTS.md???꾨줈?앺듃 洹쒖튃??湲곕줉?쒕떎**

~~~markdown
# K-water 寃쏀뭹異붿꺼 媛쒕컻 洹쒖튃

- 紐⑤뱺 ?ㅻ챸, 臾몄꽌, ?붾㈃ 臾멸뎄???쒓뎅?대? 湲곕낯?쇰줈 ?묒꽦?쒕떎.
- docs/superpowers/specs???ㅺ퀎?쒖? docs/superpowers/plans??援ы쁽 怨꾪쉷???곗꽑?쒕떎.
- Task瑜??섎굹??TDD濡??섑뻾?섍퀬 踰붿쐞瑜??꾩쓽濡??뺤옣?섏? ?딅뒗??
- 媛쒖씤?뺣낫 ?먮Ц, 鍮꾨??? 愿由ъ옄 鍮꾨?踰덊샇瑜?肄붾뱶쨌濡쒓렇쨌Git???④린吏 ?딅뒗??
- 異붿꺼怨??곹깭 蹂寃쎌? ?쒕쾭 諛??곗씠?곕쿋?댁뒪 ?몃옖??뀡?먯꽌留??ㅽ뻾?쒕떎.
- ?묒뾽 ?꾨즺 ??test:run, typecheck, lint, build瑜??ㅽ뻾?쒕떎.
- 湲곗〈 ?ъ슜??蹂寃쎌쓣 ??뼱?곌굅???섎룎由ъ? ?딅뒗??
~~~

- [ ] **Step 7: 寃利앺븯怨?而ㅻ컠?쒕떎**

~~~bash
npm run test:run
npm run typecheck
npm run lint
npm run build
git add .
git commit -m "chore: initialize prize draw application"
~~~

Expected: 紐⑤뱺 紐낅졊 PASS.

**Codex ?붿껌臾?**

~~~text
?ㅺ퀎?쒖? 援ы쁽 怨꾪쉷??Task 1留??섑뻾?댁쨾. TDD ?쒖꽌瑜?吏?ㅺ퀬 媛?紐낅졊???ㅼ젣 寃곌낵瑜?蹂닿퀬?? 踰붿쐞瑜?Task 1 諛뽰쑝濡??뺤옣?섏? 留먭퀬 ?깃났?섎㈃ 而ㅻ컠源뚯? 吏꾪뻾??
~~~

---

### Task 2: ?꾨찓???곹깭쨌?낅젰 寃利씲룹븫?명솕

**Files:**
- Create: src/lib/domain/types.ts
- Create: src/lib/domain/state-machine.ts
- Create: src/lib/domain/validation.ts
- Create: src/lib/security/pii.ts
- Test: src/lib/domain/state-machine.test.ts
- Test: src/lib/domain/validation.test.ts
- Test: src/lib/security/pii.test.ts

**Interfaces:**
- Consumes: Node crypto, Zod
- Produces: EventStatus, assertTransition(), participantSchema, normalizePhone(), encryptPii(), decryptPii(), hashPhone(), hashAccessToken()

- [ ] **Step 1: ?곹깭 ?꾪솚 ?ㅽ뙣 ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~ts
import { describe, expect, it } from "vitest";
import { assertTransition } from "./state-machine";

describe("assertTransition", () => {
  it("CLOSED?먯꽌 OPEN ?ш컻瑜??덉슜?쒕떎", () => {
    expect(() => assertTransition("CLOSED", "OPEN")).not.toThrow();
  });
  it("DRAWN?먯꽌 OPEN ?꾪솚??嫄곕??쒕떎", () => {
    expect(() => assertTransition("DRAWN", "OPEN")).toThrow("?덉슜?섏? ?딅뒗 ?됱궗 ?곹깭 ?꾪솚");
  });
});
~~~

- [ ] **Step 2: ?곕씫泥섏? ?숈쓽 寃利??ㅽ뙣 ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~ts
import { expect, it } from "vitest";
import { normalizePhone, participantSchema } from "./validation";

it("?곕씫泥섏뿉???섏씠?덇낵 怨듬갚???쒓굅?쒕떎", () => {
  expect(normalizePhone("010-1234 5678")).toBe("01012345678");
});

it("媛쒖씤?뺣낫 誘몃룞?섎? 嫄곕??쒕떎", () => {
  expect(() => participantSchema.parse({
    name: "?띻만??,
    phone: "01012345678",
    department: "?붿??멸?由ъ쿂",
    privacyConsent: false,
    accessToken: "a".repeat(43),
  })).toThrow();
});
~~~

- [ ] **Step 3: ?뷀샇???뺣났怨?寃곗젙???댁떆 ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~ts
import { expect, it } from "vitest";
import { decryptPii, encryptPii, hashPhone } from "./pii";

it("?뷀샇?뷀븳 媛쒖씤?뺣낫瑜?蹂듯샇?뷀븳??, () => {
  const key = Buffer.alloc(32, 7).toString("base64");
  expect(decryptPii(encryptPii("?띻만??, key), key)).toBe("?띻만??);
});

it("媛숈? ?곕씫泥섎뒗 媛숈? ?댁떆瑜?留뚮뱺??, () => {
  expect(hashPhone("01012345678", "secret")).toBe(hashPhone("01012345678", "secret"));
});
~~~

- [ ] **Step 4: ?뚯뒪?멸? ?ㅽ뙣?섎뒗吏 ?뺤씤?쒕떎**

Run: npx vitest run src/lib/domain src/lib/security

Expected: 紐⑤뱢???놁뼱 FAIL.

- [ ] **Step 5: ?꾨찓????낃낵 ?곹깭 ?꾪솚??援ы쁽?쒕떎**

Create src/lib/domain/types.ts:

~~~ts
export const EVENT_STATUSES = [
  "SETUP", "OPEN", "CLOSED", "DRAWN",
  "REVEALING", "REVEALED", "PUBLISHED", "PURGED",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type PrizeCode = "SCANNER" | "TUMBLER" | "KEYBOARD";
~~~

Create src/lib/domain/state-machine.ts:

~~~ts
import type { EventStatus } from "./types";

const allowed: Record<EventStatus, EventStatus[]> = {
  SETUP: ["OPEN"],
  OPEN: ["CLOSED"],
  CLOSED: ["OPEN", "DRAWN"],
  DRAWN: ["REVEALING", "REVEALED"],
  REVEALING: ["REVEALING", "REVEALED"],
  REVEALED: ["PUBLISHED"],
  PUBLISHED: ["PURGED"],
  PURGED: ["SETUP"],
};

export function assertTransition(from: EventStatus, to: EventStatus): void {
  if (!allowed[from].includes(to)) throw new Error("?덉슜?섏? ?딅뒗 ?됱궗 ?곹깭 ?꾪솚");
}
~~~

- [ ] **Step 6: ?낅젰 寃利앹쓣 援ы쁽?쒕떎**

Create src/lib/domain/validation.ts:

~~~ts
import { z } from "zod";

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export const participantSchema = z.object({
  name: z.string().trim().min(2).max(30),
  phone: z.string().transform(normalizePhone).refine((v) => /^01\d{8,9}$/.test(v)),
  department: z.string().trim().min(2).max(60),
  privacyConsent: z.literal(true),
  accessToken: z.string().min(43).max(128),
});
~~~

- [ ] **Step 7: AES-256-GCM ?뷀샇?붿? HMAC ?댁떆瑜?援ы쁽?쒕떎**

Create src/lib/security/pii.ts:

~~~ts
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

export function encryptPii(plain: string, keyBase64: string): string {
  const key = Buffer.from(keyBase64, "base64");
  if (key.length !== 32) throw new Error("PII_ENCRYPTION_KEY??32諛붿씠?몄뿬???⑸땲??);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((v) => v.toString("base64url")).join(".");
}

export function decryptPii(value: string, keyBase64: string): string {
  const [iv, tag, encrypted] = value.split(".").map((v) => Buffer.from(v, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(keyBase64, "base64"), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function hmac(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}
export const hashPhone = (phone: string, secret: string) => hmac(phone, secret);
export const hashAccessToken = (token: string, secret: string) => hmac(token, secret);
~~~

- [ ] **Step 8: 寃利앺븯怨?而ㅻ컠?쒕떎**

~~~bash
npm run test:run
npm run typecheck
git add src/lib
git commit -m "feat: add event domain and pii security"
~~~

**Codex ?붿껌臾?**

~~~text
援ы쁽 怨꾪쉷 Task 2留??섑뻾?댁쨾. ?곹깭 ?꾪솚, ?낅젰 寃利? AES-256-GCM ?뷀샇?? HMAC ?댁떆瑜??뚯뒪???곗꽑?쇰줈 援ы쁽?섍퀬 ?꾩껜 ?뚯뒪??諛???낃??щ? ?듦낵?쒗궓 ??而ㅻ컠??
~~~

---

### Task 3: Supabase ?ㅽ궎留댟룹젒洹??뺤콉쨌?먯옄??異붿꺼 ?⑥닔

**Files:**
- Create: supabase/config.toml
- Create: supabase/migrations/202609090001_initial.sql
- Create: src/lib/supabase/server.ts
- Create: src/lib/supabase/browser.ts
- Create: src/lib/supabase/types.ts
- Test: src/lib/supabase/schema-contract.test.ts

**Interfaces:**
- Consumes: Supabase ?섍꼍蹂??
- Produces: createServerClient(), createRealtimeClient(), execute_draw(), draw_replacement(), reveal_next(), publish_results(), purge_expired_events()

- [ ] **Step 1: ?ㅽ궎留?怨꾩빟 ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~ts
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/202609090001_initial.sql", "utf8");

it("以묐났 ?묐え? 以묐났 ?뱀꺼 ?쒖빟???좎뼵?쒕떎", () => {
  expect(sql).toContain("unique (event_id, phone_hash)");
  expect(sql).toContain("unique (event_id, participant_id)");
});

it("誘쇨컧 ?뚯씠釉붿쓽 RLS瑜??쒖꽦?뷀븳??, () => {
  for (const table of ["participants", "draw_results", "audit_logs"]) {
    expect(sql).toContain("alter table public." + table + " enable row level security");
  }
});
~~~

- [ ] **Step 2: ?뚯뒪???ㅽ뙣瑜??뺤씤?쒕떎**

Run: npx vitest run src/lib/supabase/schema-contract.test.ts

Expected: migration ?뚯씪???놁뼱 FAIL.

- [ ] **Step 3: ?듭떖 ?뚯씠釉붿쓣 migration???묒꽦?쒕떎**

~~~sql
create extension if not exists pgcrypto;
create type public.event_status as enum
  ('SETUP','OPEN','CLOSED','DRAWN','REVEALING','REVEALED','PUBLISHED','PURGED');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  venue text not null default '',
  starts_at timestamptz,
  privacy_items text[] not null default array['?대쫫','?곕씫泥?,'遺??],
  privacy_purpose text not null default '李몄꽍???ъ쟾議고쉶 諛??대깽??吏꾪뻾',
  retention_days integer not null default 7 check (retention_days = 7),
  status public.event_status not null default 'SETUP',
  published_at timestamptz,
  purge_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index only_one_live_event on public.events ((true)) where status <> 'PURGED';

create table public.prizes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  code text not null check (code in ('SCANNER','TUMBLER','KEYBOARD')),
  name text not null,
  quantity integer not null check (quantity >= 0 and quantity <= 500),
  reveal_order integer not null,
  unique (event_id, code),
  unique (event_id, reveal_order)
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name_ciphertext text not null,
  phone_ciphertext text not null,
  department_ciphertext text not null,
  phone_hash text not null,
  access_token_hash text not null unique,
  consented_at timestamptz not null,
  disqualified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, phone_hash)
);

create table public.draw_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  prize_id uuid not null references public.prizes(id) on delete cascade,
  reveal_position integer not null,
  revealed_at timestamptz,
  replaced_at timestamptz,
  unawarded_at timestamptz,
  replacement_reason text,
  created_at timestamptz not null default now(),
  unique (event_id, participant_id),
  unique (prize_id, reveal_position)
);

create table public.reveal_state (
  event_id uuid primary key references public.events(id) on delete cascade,
  revealed_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  event_id uuid references public.events(id) on delete cascade,
  action text not null,
  reason text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.admin_login_attempts (
  ip_hash text primary key,
  failures integer not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);
~~~

- [ ] **Step 4: RLS? ?쒕쾭 ?꾩슜 ?묎렐???곸슜?쒕떎**

~~~sql
alter table public.events enable row level security;
alter table public.prizes enable row level security;
alter table public.participants enable row level security;
alter table public.draw_results enable row level security;
alter table public.reveal_state enable row level security;
alter table public.audit_logs enable row level security;
alter table public.admin_login_attempts enable row level security;
revoke all on all tables in schema public from anon, authenticated;
~~~

釉뚮씪?곗? ??븷?먮뒗 吏곸젒 ?뚯씠釉?沅뚰븳??二쇱? ?딅뒗?? ?좏뵆由ъ??댁뀡 ?쎄린쨌?곌린???쒕쾭 Route Handler瑜??듦낵?쒕떎.

- [ ] **Step 5: 理쒖큹 異붿꺼 PostgreSQL ?⑥닔瑜??묒꽦?쒕떎**

~~~sql
create or replace function public.execute_draw(p_event_id uuid)
returns integer language plpgsql security definer set search_path = public
as $$
declare v_status public.event_status; v_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_event_id::text, 0));
  select status into v_status from events where id = p_event_id for update;
  if v_status <> 'CLOSED' then raise exception 'EVENT_NOT_CLOSED'; end if;
  if exists (select 1 from draw_results where event_id = p_event_id) then
    select count(*) into v_count from draw_results where event_id = p_event_id;
    return v_count;
  end if;

  with shuffled_people as (
    select id, row_number() over (order by gen_random_uuid()) rn
    from participants where event_id = p_event_id and disqualified_at is null
  ), prize_slots as (
    select p.id prize_id, row_number() over (order by gen_random_uuid()) rn
    from prizes p cross join lateral generate_series(1, p.quantity)
    where p.event_id = p_event_id
  ), assigned as (
    select sp.id participant_id, ps.prize_id
    from shuffled_people sp join prize_slots ps using (rn)
  ), ranked as (
    select participant_id, prize_id,
      row_number() over (partition by prize_id order by gen_random_uuid()) reveal_position
    from assigned
  )
  insert into draw_results(event_id, participant_id, prize_id, reveal_position)
  select p_event_id, participant_id, prize_id, reveal_position from ranked;

  insert into reveal_state(event_id) values (p_event_id);
  update events set status = 'DRAWN', updated_at = now() where id = p_event_id;
  insert into audit_logs(event_id, action) values (p_event_id, 'DRAW_EXECUTED');
  select count(*) into v_count from draw_results where event_id = p_event_id;
  return v_count;
end;
$$;
~~~

- [ ] **Step 6: ?섎㉧吏 ?먯옄???⑥닔瑜??꾩꽦?쒕떎**

draw_replacement, reveal_next, publish_results, purge_expired_events瑜?SECURITY DEFINER ?⑥닔濡?援ы쁽?쒕떎. 紐⑤뱺 ?⑥닔???됱궗蹂?advisory transaction lock, ?곹깭 寃?? ?묒뾽 ?대젰 湲곕줉???ы븿?섍퀬 anon/authenticated?먮뒗 ?ㅽ뻾 沅뚰븳??二쇱? ?딅뒗??

Return contracts:

~~~ts
type ReplacementResult = {
  resultId: string;
  removedParticipantId: string;
  replacementParticipantId: string | null;
};
type RevealResult = { status: "REVEALING" | "REVEALED"; resultId: string | null };
type PublishResult = { publishedAt: string; purgeAt: string };
type PurgeResult = { purgedEventIds: string[] };
~~~

draw_replacement??湲곗〈 draw_results ?됱쓽 participant_id留??泥?李몄꽍?먮줈 媛깆떊??寃쏀뭹怨?reveal_position??蹂댁〈?쒕떎. ?댁쟾 李몄꽍?먮뒗 disqualified_at??湲곕줉?섍퀬 蹂寃??꾪썑 ?앸퀎?먮뒗 audit_logs???④릿?? ?꾨낫媛 ?놁쑝硫?unawarded_at??湲곕줉???대떦 ?щ’??誘몄텛泥?泥섎━?쒕떎.

紐⑤뱺 ?⑥닔瑜?留뚮뱺 ?ㅼ쓬 怨듦컻 ?ㅽ뻾 沅뚰븳???ㅼ떆 ?뚯닔?쒕떎:

~~~sql
revoke all on function public.execute_draw(uuid) from public, anon, authenticated;
revoke all on function public.draw_replacement(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.reveal_next(uuid) from public, anon, authenticated;
revoke all on function public.publish_results(uuid) from public, anon, authenticated;
revoke all on function public.purge_expired_events() from public, anon, authenticated;
~~~

- [ ] **Step 7: Supabase clients瑜??묒꽦?쒕떎**

src/lib/supabase/server.ts??createServerClient()??SUPABASE_SERVICE_ROLE_KEY? persistSession: false瑜??ъ슜?쒕떎. src/lib/supabase/browser.ts??createRealtimeClient()??怨듦컻 URL怨?anon key留??ъ슜?섍퀬 媛쒖씤?뺣낫 ?녿뒗 Broadcast 援щ룆?먮쭔 ?ъ슜?쒕떎.

- [ ] **Step 8: 濡쒖뺄 ?곗씠?곕쿋?댁뒪? ?뚯뒪?몃? 寃利앺븳??*

~~~bash
npx supabase init
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local > src/lib/supabase/types.ts
npm run test:run
npm run typecheck
git add supabase src/lib/supabase
git commit -m "feat: add secure prize draw database"
~~~

Expected: migration怨?怨꾩빟 ?뚯뒪??PASS.

**Codex ?붿껌臾?**

~~~text
援ы쁽 怨꾪쉷 Task 3留??섑뻾?댁쨾. Supabase migration怨??쒕쾭 ?꾩슜 ?묎렐 ?뺤콉, ?먯옄??異붿꺼쨌?泥댁텛泥㉱룹닚李④났媛쑣룰껐怨쇨났?졖룸쭔猷뚯궘???⑥닔瑜??꾩꽦?? ?곹깭 議곌굔??SQL?먯꽌 媛뺤젣?섍퀬 濡쒖뺄 DB reset怨??뚯뒪??寃곌낵瑜?蹂닿퀬????而ㅻ컠??
~~~

---

### Task 4: 怨듭슜 鍮꾨?踰덊샇 ?몄쬆怨?愿由ъ옄 ?몄뀡

**Files:**
- Create: src/lib/security/admin-session.ts
- Create: src/lib/security/rate-limit.ts
- Create: src/app/api/auth/login/route.ts
- Create: src/app/api/auth/logout/route.ts
- Create: src/features/admin/AdminLogin.tsx
- Test: src/lib/security/admin-session.test.ts
- Test: src/app/api/auth/login/route.test.ts

**Interfaces:**
- Consumes: ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET
- Produces: createAdminSession(), verifyAdminSession(), requireAdmin(), POST /api/auth/login, POST /api/auth/logout

- [ ] **Step 1: ?몄뀡 寃利??뚯뒪?몃? ?묒꽦?쒕떎**

~~~ts
import { expect, it } from "vitest";
import { createAdminSession, verifyAdminSession } from "./admin-session";

it("諛쒓툒???몄뀡??寃利앺븳??, async () => {
  const secret = "x".repeat(32);
  const token = await createAdminSession(secret, 3600);
  await expect(verifyAdminSession(token, secret)).resolves.toMatchObject({ role: "admin" });
});
~~~

- [ ] **Step 2: 濡쒓렇??Route ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~text
?뺥솗??鍮꾨?踰덊샇 -> 200怨?admin_session HttpOnly 荑좏궎
?由?鍮꾨?踰덊샇 -> 401?대ŉ 荑좏궎 ?놁쓬
10遺??덉뿉 5???곗냽 ?ㅽ뙣 -> 429? blockedUntil
?깃났 -> ?ㅽ뙣 ?잛닔 珥덇린??
濡쒓렇?꾩썐 -> 荑좏궎 利됱떆 留뚮즺
~~~

- [ ] **Step 3: ?ㅽ뙣瑜??뺤씤?쒕떎**

Run: npx vitest run src/lib/security/admin-session.test.ts src/app/api/auth/login/route.test.ts

Expected: 紐⑤뱢 ?놁쓬?쇰줈 FAIL.

- [ ] **Step 4: jose 湲곕컲 ?몄뀡??援ы쁽?쒕떎**

~~~ts
import { SignJWT, jwtVerify } from "jose";
const encoder = new TextEncoder();

export async function createAdminSession(secret: string, ttlSeconds: number): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(encoder.encode(secret));
}

export async function verifyAdminSession(token: string, secret: string) {
  const result = await jwtVerify(token, encoder.encode(secret));
  if (result.payload.role !== "admin") throw new Error("ADMIN_REQUIRED");
  return result.payload as { role: "admin"; exp: number };
}
~~~

- [ ] **Step 5: 濡쒓렇???쒗븳怨?Route Handler瑜?援ы쁽?쒕떎**

- bcrypt.compare濡?ADMIN_PASSWORD_HASH瑜?寃利앺븳??
- IP ?먮Ц ???LOGIN_RATE_HASH_SECRET?쇰줈 留뚮뱺 HMAC留?admin_login_attempts????ν븳??
- 10遺??덉뿉 5???ㅽ뙣?섎㈃ 15遺??숈븞 429瑜?諛섑솚?쒕떎.
- ?깃났 ???ㅽ뙣 湲곕줉??吏?곌퀬 admin_session 荑좏궎瑜?8?쒓컙?쇰줈 ?ㅼ젙?쒕떎.
- cookie attributes: httpOnly true, secure production only, sameSite strict, path /.

- [ ] **Step 6: 濡쒓렇??UI瑜?援ы쁽?쒕떎**

~~~ts
type AdminLoginProps = { onSuccess?: () => void };
~~~

鍮꾨?踰덊샇, 濡쒓렇??踰꾪듉, ?ㅻ쪟 硫붿떆吏, ?좉툑 ?⑥? ?쒓컙???쒓났?쒕떎. 鍮꾨?踰덊샇瑜?URL, localStorage, console???④린吏 ?딅뒗??

- [ ] **Step 7: 寃利앺븯怨?而ㅻ컠?쒕떎**

~~~bash
npm run test:run
npm run typecheck
npm run lint
git add src/lib/security src/app/api/auth src/features/admin
git commit -m "feat: protect admin and display access"
~~~

**Codex ?붿껌臾?**

~~~text
援ы쁽 怨꾪쉷 Task 4留??섑뻾?댁쨾. 怨듭슜 鍮꾨?踰덊샇, ?쒕쾭痢??ㅽ뙣 ?쒗븳, 8?쒓컙 HttpOnly ?몄뀡, 濡쒓렇?꾩썐???뚯뒪???곗꽑?쇰줈 援ы쁽?? 鍮꾨?踰덊샇? IP ?먮Ц????Β룰린濡앸릺吏 ?딅뒗吏 ?뺤씤?섍퀬 而ㅻ컠??
~~~

---

### Task 5: 怨듦컻 ?됱궗 議고쉶? 李몄꽍???묐え API

**Files:**
- Create: src/lib/domain/public-event.ts
- Create: src/lib/domain/participant.ts
- Create: src/app/api/public/event/route.ts
- Create: src/app/api/participants/route.ts
- Create: src/app/api/participants/result/route.ts
- Test: src/app/api/participants/route.test.ts
- Test: src/app/api/participants/result/route.test.ts

**Interfaces:**
- Consumes: participantSchema, encryptPii(), hashPhone(), hashAccessToken(), createServerClient()
- Produces: GET /api/public/event, POST /api/participants, GET /api/participants/result

- [ ] **Step 1: ?묐え API 怨꾩빟 ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~text
OPEN + ?좏슚 ?낅젰 -> 201, participantId留?諛섑솚
?숈씪 ?꾪솕 + ?숈씪 ?좏겙 ?ъ떆??-> 200, 湲곗〈 participantId 諛섑솚
?숈씪 ?꾪솕 + ?ㅻⅨ ?좏겙 -> 409 DUPLICATE_PHONE
CLOSED -> 409 EVENT_CLOSED
privacyConsent false -> 400 INVALID_INPUT
?묐떟怨?濡쒓렇??name, phone, department ?먮Ц ?놁쓬
~~~

- [ ] **Step 2: 媛쒖씤 寃곌낵 API 怨꾩빟 ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~text
?좏겙 ?놁쓬 -> 401
?????녿뒗 ?좏겙 -> 404
DRAWN ?먮뒗 REVEALED -> 200 { state: "WAITING" }
PUBLISHED ?뱀꺼??-> 200 { state: "WINNER", name, prizeName }
PUBLISHED 誘몃떦泥⑥옄 -> 200 { state: "NOT_WINNER", name }
?ㅻⅨ 李멸??먯쓽 寃곌낵??諛섑솚?섏? ?딆쓬
~~~

- [ ] **Step 3: ?뚯뒪???ㅽ뙣瑜??뺤씤?쒕떎**

Run: npx vitest run src/app/api/participants

Expected: Route Handler ?놁쓬?쇰줈 FAIL.

- [ ] **Step 4: 怨듦컻 ?됱궗 ?묐떟 ?뺤떇??援ы쁽?쒕떎**

~~~ts
export type PublicEventResponse = {
  id: string;
  title: string;
  description: string;
  venue: string;
  startsAt: string | null;
  status: "SETUP" | "OPEN" | "CLOSED" | "DRAWN" | "REVEALING" | "REVEALED" | "PUBLISHED" | "PURGED";
  participantCount: number;
  privacy: { items: string[]; purpose: string; retentionDays: 7 };
};
~~~

- [ ] **Step 5: ?묐え ??μ쓣 援ы쁽?쒕떎**

釉뚮씪?곗????쒖텧 ?꾩뿉 crypto.getRandomValues濡?43???댁긽??accessToken???앹꽦??kwater-prize-access-token????ν븯怨?HTTPS濡??꾩넚?쒕떎. ?쒕쾭???낅젰 ?뚯떛, ?됱궗 OPEN ?ы솗?? 媛쒖씤?뺣낫 ?뷀샇?? PHONE_HASH_SECRET???ъ슜???곕씫泥??댁떆, PARTICIPANT_TOKEN_HASH_SECRET???ъ슜???좏겙 ?댁떆, insert瑜??쒖꽌?濡??ㅽ뻾?쒕떎. 怨좎쑀 ?쒖빟 ?ㅻ쪟??媛숈? ?좏겙???ъ떆?꾨㈃ 湲곗〈 ?깅줉 ?깃났?쇰줈, ?ㅻⅨ ?좏겙?대㈃ DUPLICATE_PHONE?쇰줈 蹂?섑븳??

- [ ] **Step 6: 媛쒖씤 寃곌낵 議고쉶瑜?援ы쁽?쒕떎**

Authorization: Bearer ACCESS_TOKEN???ъ슜?쒕떎. ?쒕쾭??PARTICIPANT_TOKEN_HASH_SECRET?쇰줈 ?좏겙???댁떆????紐낅쭔 李얘퀬 ?됱궗 ?곹깭瑜?寃?ы븳 ??洹?李몄꽍?먯뿉寃??덉슜???꾨뱶留?蹂듯샇?뷀븳??

- [ ] **Step 7: 寃利앺븯怨?而ㅻ컠?쒕떎**

~~~bash
npm run test:run
npm run typecheck
npm run lint
git add src/lib/domain src/app/api/public src/app/api/participants
git commit -m "feat: add secure participant entry api"
~~~

**Codex ?붿껌臾?**

~~~text
援ы쁽 怨꾪쉷 Task 5留??섑뻾?댁쨾. 怨듦컻 ?됱궗 議고쉶, ?곕씫泥?以묐났 諛⑹? ?묐え, 媛쒖씤 ?좏겙 湲곕컲 寃곌낵 議고쉶 API瑜??뚯뒪???곗꽑?쇰줈 援ы쁽?? 誘쇨컧?뺣낫媛 ?묐떟쨌濡쒓렇??遺덊븘?뷀븯寃??ы븿?섏? ?딅뒗吏 ?뚯뒪?명븯怨?而ㅻ컠??
~~~

---

### Task 6: 李몄꽍??紐⑤컮???붾㈃

**Files:**
- Create: src/features/participant/ParticipantApp.tsx
- Create: src/features/participant/EntryForm.tsx
- Create: src/features/participant/WaitingScreen.tsx
- Create: src/features/participant/ResultScreen.tsx
- Create: src/features/participant/useParticipantState.ts
- Modify: src/app/page.tsx
- Modify: src/app/globals.css
- Test: src/features/participant/ParticipantApp.test.tsx

**Interfaces:**
- Consumes: 怨듦컻 ?됱궗쨌?묐え쨌媛쒖씤 寃곌낵 API
- Produces: 紐⑤컮???묐え쨌?湲걔룸떦泥㉱룸??뱀꺼쨌留덇컧 ?붾㈃

- [ ] **Step 1: ?붾㈃ ?곹깭 ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~tsx
it("OPEN?대㈃ ??媛??꾩닔 ??ぉ怨?寃쏀뭹 ?묐え 踰꾪듉???쒖떆?쒕떎", async () => {});
it("誘몃룞???곹깭?먯꽌???묐え 踰꾪듉??鍮꾪솢?깊솕?쒕떎", async () => {});
it("?묐え ?깃났 ???湲??붾㈃???쒖떆?쒕떎", async () => {});
it("WINNER?대㈃ ?됰났??諛⑹슱?댁? 寃쏀뭹紐낆쓣 ?쒖떆?쒕떎", async () => {});
it("NOT_WINNER?대㈃ ?ы띁?섎뒗 諛⑹슱?댁? 苑?臾멸뎄瑜??쒖떆?쒕떎", async () => {});
it("誘몄쓳紐??곹깭?먯꽌 CLOSED?대㈃ 留덇컧 ?붾㈃???쒖떆?쒕떎", async () => {});
~~~

援ы쁽 ?꾩뿉 媛?鍮?蹂몃Ц??Testing Library ?곹샇?묒슜怨?fetch mock assertion?쇰줈 ?꾩꽦?쒕떎.

- [ ] **Step 2: ?뚯뒪???ㅽ뙣瑜??뺤씤?쒕떎**

Run: npx vitest run src/features/participant

Expected: 而댄룷?뚰듃 ?놁쓬?쇰줈 FAIL.

- [ ] **Step 3: EntryForm??援ы쁽?쒕떎**

Exact labels:

~~~text
1. 李몄꽍???깊븿
2. ?곕씫泥?(010-0000-0000)
3. ?뚯냽遺?쒕챸
4. 媛쒖씤?뺣낫 ?섏쭛 諛??댁슜 ?숈쓽
?숈쓽?⑸땲??
?숈쓽?섏? ?딆뒿?덈떎
寃쏀뭹 ?묐え
~~~

label/input ?곌껐, aria-live ?ㅻ쪟 ?붿빟, ?곕씫泥?inputMode numeric? autoComplete tel???곸슜?쒕떎. NAVER ?곹몴???ъ슜?섏? ?딅뒗??

- [ ] **Step 4: ?붾㈃ ?곹깭 紐⑤뜽怨?寃곌낵 ?대?吏瑜?援ы쁽?쒕떎**

~~~ts
type ParticipantView =
  | { kind: "FORM" }
  | { kind: "CLOSED" }
  | { kind: "WAITING"; name: string }
  | { kind: "WINNER"; name: string; prizeName: string }
  | { kind: "NOT_WINNER"; name: string }
  | { kind: "PURGED" };
~~~

WINNER??/images/bangwool-happy.png? alt="湲곕퍙?섎뒗 諛⑹슱??, NOT_WINNER??/images/bangwool-sad.png? alt="?ы띁?섎뒗 諛⑹슱??瑜??ъ슜?쒕떎.

- [ ] **Step 5: ?뱀씤??紐⑤컮???붿옄?몄쓣 ?곸슜?쒕떎**

~~~text
諛곌꼍 #F5F7FA
移대뱶 ?곗깋, radius 24px, ????洹몃┝??
二쇱슂??#08B9D6
?ㅻ쪟??#EF3340
?낅젰李승룸쾭??理쒖냼 ?믪씠 56px
肄섑뀗痢?理쒕? ?덈퉬 720px
紐⑤컮??醫뚯슦 ?щ갚 20px
?대?吏 object-fit contain, ?먮Ⅴ湲?湲덉?
~~~

- [ ] **Step 6: 寃利앺븯怨?而ㅻ컠?쒕떎**

~~~bash
npm run test:run
npm run typecheck
npm run lint
npm run build
git add src/app src/features/participant public/images
git commit -m "feat: build participant entry and result screens"
~~~

**Codex ?붿껌臾?**

~~~text
援ы쁽 怨꾪쉷 Task 6留??섑뻾?댁쨾. ?ㅼ씠踰???罹≪쿂???덉씠?꾩썐 李멸퀬濡쒕쭔 ?ъ슜?섍퀬 NAVER ?곹몴??蹂듭젣?섏? 留? ??諛⑹슱???대?吏瑜?public/images???곷Ц ?뚯씪紐낆쑝濡?蹂듭궗??寃곌낵 ?붾㈃???뺥솗???곌껐?섍퀬 紐⑤컮???묎렐???뚯뒪?멸퉴吏 ?듦낵?쒖폒 而ㅻ컠??
~~~

---

### Task 7: 異붿꺼쨌?泥?異붿꺼 ?쒕쾭 API

**Files:**
- Create: src/lib/domain/draw.ts
- Create: src/app/api/admin/draw/route.ts
- Create: src/app/api/admin/replacement/route.ts
- Test: src/app/api/admin/draw/route.test.ts
- Test: src/app/api/admin/replacement/route.test.ts

**Interfaces:**
- Consumes: requireAdmin(), execute_draw(), draw_replacement()
- Produces: POST /api/admin/draw, POST /api/admin/replacement, assertDrawInvariants()

- [ ] **Step 1: 異붿꺼 API ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~text
愿由ъ옄 ?몄뀡 ?놁쓬 -> 401
OPEN ?곹깭 -> 409 EVENT_NOT_CLOSED
CLOSED ?곹깭 -> RPC ??踰??몄텧, 200 { winnerCount }
?숈떆????踰??몄텧 -> 媛숈? 寃곌낵? winnerCount
?묐떟??誘멸났媛??뱀꺼??媛쒖씤?뺣낫 ?놁쓬
~~~

- [ ] **Step 2: ?泥?異붿꺼 API ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~text
DRAWN~REVEALED ?곹깭 + ?ъ쑀 -> 媛숈? prizeId?????뱀꺼??
鍮??ъ쑀 -> 400
PUBLISHED -> 409 RESULT_ALREADY_PUBLISHED
?꾨낫 ?놁쓬 -> 200 { replacement: null, unawarded: true }
~~~

- [ ] **Step 3: ?뚯뒪???ㅽ뙣瑜??뺤씤?쒕떎**

Run: npx vitest run src/app/api/admin/draw src/app/api/admin/replacement

Expected: Route Handler ?놁쓬?쇰줈 FAIL.

- [ ] **Step 4: 愿由ъ옄 ?꾩슜 API? 遺덈???寃利앹쓣 援ы쁽?쒕떎**

~~~ts
export type DrawInvariantInput = {
  results: { participantId: string; prizeId: string }[];
  prizeLimits: Record<string, number>;
};

export function assertDrawInvariants(input: DrawInvariantInput): void {
  const ids = input.results.map((result) => result.participantId);
  if (new Set(ids).size !== ids.length) throw new Error("DUPLICATE_WINNER");
  for (const [prizeId, limit] of Object.entries(input.prizeLimits)) {
    if (input.results.filter((result) => result.prizeId === prizeId).length > limit) {
      throw new Error("PRIZE_LIMIT_EXCEEDED");
    }
  }
}
~~~

媛?Route Handler??requireAdmin, Zod UUID쨌?ъ쑀 寃利? RPC ?몄텧, ?뚮젮吏?SQL ?ㅻ쪟???덉젙???ㅻ쪟 肄붾뱶 蹂?섏쓣 ?섑뻾?쒕떎. ?먯떆 DB ?ㅻ쪟 臾멸뎄??諛섑솚?섏? ?딅뒗??

- [ ] **Step 5: 寃利앺븯怨?而ㅻ컠?쒕떎**

~~~bash
npm run test:run
npm run typecheck
git add src/lib/domain/draw.ts src/app/api/admin
git commit -m "feat: expose atomic draw operations"
~~~

**Codex ?붿껌臾?**

~~~text
援ы쁽 怨꾪쉷 Task 7留??섑뻾?댁쨾. 愿由ъ옄 異붿꺼怨?媛쒕퀎 ?泥?異붿꺼 API瑜?SQL RPC???곌껐?섍퀬 ?곹깭 ?ㅻ쪟, 沅뚰븳 ?ㅻ쪟, 以묐났 ?ㅽ뻾, ?꾨낫 ?놁쓬源뚯? ?뚯뒪?명빐. 異붿꺼 寃곌낵 遺덈???寃利앸룄 異붽?????而ㅻ컠??
~~~

---

### Task 8: 愿由ъ옄 ?됱궗쨌李몄꽍?먃룹쭊????쒕낫??

**Files:**
- Create: src/app/api/admin/event/route.ts
- Create: src/app/api/admin/participants/route.ts
- Create: src/app/api/admin/publish/route.ts
- Create: src/features/admin/AdminDashboard.tsx
- Create: src/features/admin/EventSettings.tsx
- Create: src/features/admin/ParticipantTable.tsx
- Create: src/features/admin/DrawControls.tsx
- Modify: src/app/admin/page.tsx
- Test: src/features/admin/AdminDashboard.test.tsx

**Interfaces:**
- Consumes: 愿由ъ옄 API, AdminLogin
- Produces: ?됱궗 ?ㅼ젙쨌紐낅떒 愿由?룸쭏媛먃룹텛泥㉱룸?泥?異붿꺼쨌寃곌낵 怨듭쑀 UI

- [ ] **Step 1: ?곹깭蹂?踰꾪듉 ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~text
SETUP -> ?묐え ?쒖옉 ?쒖꽦
OPEN -> ?묐え 留덇컧 ?쒖꽦
CLOSED -> ?묐え ?ш컻? 異붿꺼 ?ㅽ뻾 ?쒖꽦
DRAWN/REVEALING/REVEALED -> 李몄꽍???섏젙 鍮꾪솢??
REVEALED -> 寃곌낵 怨듭쑀 ?쒖꽦
PUBLISHED -> 寃곌낵 蹂寃?鍮꾪솢?? ??젣 ?덉젙???쒖떆
~~~

- [ ] **Step 2: 媛쒖씤?뺣낫 ?쒖떆 ?뚯뒪?몃? ?묒꽦?쒕떎**

愿由ъ옄 ?몄뀡???덉쓣 ?뚮쭔 ?깅챸, 蹂듯샇???곕씫泥? 遺?쒓? ?쒖떆?섍퀬 ?뚮뜑 怨쇱젙?먯꽌 console 異쒕젰??諛쒖깮?섏? ?딅뒗吏 ?뺤씤?쒕떎.

- [ ] **Step 3: ?뚯뒪???ㅽ뙣瑜??뺤씤?쒕떎**

Run: npx vitest run src/features/admin

Expected: 而댄룷?뚰듃 ?놁쓬?쇰줈 FAIL.

- [ ] **Step 4: 愿由ъ옄 API瑜?援ы쁽?쒕떎**

- GET /api/admin/event: ?됱궗, 寃쏀뭹, ?몄썝, 怨듦컻 吏꾪뻾瑜? purgeAt 諛섑솚.
- PATCH /api/admin/event: SETUP?먯꽌 ?됱궗쨌媛쒖씤?뺣낫 臾멸뎄쨌寃쏀뭹 ?섏젙, ?곹깭 ?꾪솚? assertTransition ?곸슜.
- GET/PATCH/DELETE /api/admin/participants: OPEN ?먮뒗 CLOSED?먯꽌留??섏젙쨌??젣.
- POST /api/admin/publish: REVEALED?먯꽌留?publish_results ?몄텧.
- 李몄꽍??紐⑸줉? ?쒕쾭?먯꽌 蹂듯샇?뷀븯怨?ciphertext? hash??諛섑솚?섏? ?딅뒗??

- [ ] **Step 5: 愿由ъ옄 ??쒕낫?쒕? 援ы쁽?쒕떎**

Confirmation copy:

~~~text
?묐え瑜?留덇컧?좉퉴?? ?꾩옱 ?묐え?먮뒗 235紐낆엯?덈떎.
235紐낆쓣 ??곸쑝濡?異붿꺼???ㅽ뻾?좉퉴?? ?ㅽ뻾 ???꾩껜 ?ъ텛泥⑥? ?????놁뒿?덈떎.
?꾩껜 寃곌낵瑜?李몄꽍?먯뿉寃?怨듭쑀?좉퉴?? 怨듭쑀 ???뱀꺼 寃곌낵瑜?蹂寃쏀븷 ???놁뒿?덈떎.
~~~

???곹깭?먯꽌 ?섎굹??二??묒뾽??媛뺤“?쒕떎. ?泥?異붿꺼? 湲곗〈 ?뱀꺼?? ?숈씪 寃쏀뭹, ?꾩닔 ?ъ쑀瑜?蹂댁뿬二쇨퀬 ?꾩껜 ?ъ텛泥?踰꾪듉? 留뚮뱾吏 ?딅뒗??

- [ ] **Step 6: 寃利앺븯怨?而ㅻ컠?쒕떎**

~~~bash
npm run test:run
npm run typecheck
npm run lint
npm run build
git add src/app/admin src/app/api/admin src/features/admin
git commit -m "feat: build event administration dashboard"
~~~

**Codex ?붿껌臾?**

~~~text
援ы쁽 怨꾪쉷 Task 8留??섑뻾?댁쨾. ?됱궗 ?곹깭蹂?愿由ъ옄 踰꾪듉, 李몄꽍??愿由? 異붿꺼 ?뺤씤李? ?泥?異붿꺼, 寃곌낵 怨듭쑀 UI瑜?援ы쁽?? ?쒕쾭? ?붾㈃ ?묒そ?먯꽌 ?곹깭 議곌굔??媛뺤젣?섍퀬 ?뚯뒪?맞룸퉴?쒕? ?듦낵?쒖폒 而ㅻ컠??
~~~

---

### Task 9: 媛뺤뿰??QR 諛?Enter ?쒖감 怨듦컻

**Files:**
- Create: src/app/api/admin/reveal/route.ts
- Create: src/features/display/DisplayApp.tsx
- Create: src/features/display/QrStage.tsx
- Create: src/features/display/RevealStage.tsx
- Create: src/features/display/useEnterReveal.ts
- Modify: src/app/display/page.tsx
- Test: src/features/display/useEnterReveal.test.tsx
- Test: src/features/display/DisplayApp.test.tsx

**Interfaces:**
- Consumes: requireAdmin(), reveal_next(), 怨듦컻 ?됱궗 API
- Produces: ?몄쬆???꾨줈?앺꽣 ?붾㈃怨?POST /api/admin/reveal

- [ ] **Step 1: ?ㅻ낫???낅젰 ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~tsx
it("Enter ??踰덉뿉 reveal API瑜???踰덈쭔 ?몄텧?쒕떎", async () => {});
it("Enter瑜?湲멸쾶 ?뚮윭???좉툑 ?쒓컙 ?숈븞 異붽? ?몄텧?섏? ?딅뒗??, async () => {});
it("?낅젰 ?붿냼???ъ빱?ㅺ? ?덉쑝硫?Enter瑜?臾댁떆?쒕떎", async () => {});
it("REVEALED ?곹깭?먯꽌??API瑜??몄텧?섏? ?딅뒗??, async () => {});
~~~

援ы쁽 ?꾩뿉 媛?鍮?蹂몃Ц??userEvent.keyboard? fake timers瑜??ъ슜??assertion?쇰줈 ?꾩꽦?쒕떎.

- [ ] **Step 2: ?뚯뒪???ㅽ뙣瑜??뺤씤?쒕떎**

Run: npx vitest run src/features/display

Expected: 紐⑤뱢 ?놁쓬?쇰줈 FAIL.

- [ ] **Step 3: reveal API ?묐떟 怨꾩빟??援ы쁽?쒕떎**

~~~ts
type RevealApiResponse = {
  eventStatus: "REVEALING" | "REVEALED";
  prizeCode: "SCANNER" | "TUMBLER" | "KEYBOARD" | null;
  prizeName: string | null;
  revealedWinner: { name: string; department: string } | null;
  groups: Array<{
    prizeCode: "SCANNER" | "TUMBLER" | "KEYBOARD";
    prizeName: string;
    winners: Array<{ name: string; department: string }>;
  }>;
};
~~~

?몄뀡 寃利???reveal_next瑜??몄텧?섍퀬 ?대? 怨듦컻???대쫫쨌遺?쒕쭔 蹂듯샇?뷀빐 諛섑솚?쒕떎.

- [ ] **Step 4: QR怨??쒖감 怨듦컻 ?붾㈃??援ы쁽?쒕떎**

- qrcode.react濡?window.location.origin + "/" ?몄퐫??
- 1080p?먯꽌 QR 理쒖냼 360px? ???щ갚 ?좎?.
- 16:9 媛濡??덉씠?꾩썐.
- ?ㅼ틪湲곌린, ?釉붾윭, ?ㅻ낫???쒖꽌.
- Enter 500ms ?좉툑, 怨듦컻 ?좊땲硫붿씠??700ms.
- prefers-reduced-motion?먯꽌???대룞 ?놁씠 利됱떆 ?쒖떆.
- ?덈줈怨좎묠?섎㈃ ?쒕쾭??groups? ?꾩옱 ?곹깭 ?ъ“??

- [ ] **Step 5: 寃利앺븯怨?而ㅻ컠?쒕떎**

~~~bash
npm run test:run
npm run typecheck
npm run lint
npm run build
git add src/app/display src/app/api/admin/reveal src/features/display
git commit -m "feat: add auditorium qr and winner reveal"
~~~

**Codex ?붿껌臾?**

~~~text
援ы쁽 怨꾪쉷 Task 9留??섑뻾?댁쨾. 怨듭슜 鍮꾨?踰덊샇 ?몄뀡?쇰줈 蹂댄샇??媛뺤뿰???붾㈃, 16:9 QR ?붾㈃, Enter ??踰덈떦 ??紐?怨듦컻, 怨듦컻 ?쒖꽌? ?덈줈怨좎묠 蹂듦뎄瑜??뚯뒪???곗꽑?쇰줈 援ы쁽?섍퀬 而ㅻ컠??
~~~

---

### Task 10: ?ㅼ떆媛??뚮┝쨌寃곌낵 怨듭쑀쨌?먮룞 ??젣

**Files:**
- Create: src/lib/realtime/events.ts
- Create: src/features/participant/useEventSignal.ts
- Create: src/app/api/cron/purge/route.ts
- Create: vercel.json
- Test: src/lib/realtime/events.test.ts
- Test: src/app/api/cron/purge/route.test.ts

**Interfaces:**
- Consumes: Supabase Realtime, publish_results(), purge_expired_events()
- Produces: broadcastEventSignal(), subscribeEventSignal(), GET /api/cron/purge

- [ ] **Step 1: 媛쒖씤?뺣낫 ?녿뒗 ?좏샇 怨꾩빟 ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~ts
export type EventSignal = {
  eventId: string;
  status: "OPEN" | "CLOSED" | "DRAWN" | "REVEALING" | "REVEALED" | "PUBLISHED" | "PURGED";
  changedAt: string;
};
~~~

payload??name, phone, department, participantId, prize assignment, access token, ciphertext媛 ?놁쓬??寃?ы븳??

- [ ] **Step 2: 寃곌낵 怨듭쑀? fallback ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~text
REVEALED?먯꽌 publish -> publishedAt怨?7????purgeAt ???
REVEALING?먯꽌 publish -> 409 REVEAL_NOT_COMPLETE
??踰?publish -> 媛숈? publishedAt 諛섑솚
publish ?좏샇 ?섏떊 -> 媛쒖씤 寃곌낵 API ?ъ“??
Realtime ?ㅽ뙣 -> 5珥?媛꾧꺽 ?곹깭 議고쉶
~~~

- [ ] **Step 3: cron ?몄쬆怨???젣 ?뚯뒪?몃? ?묒꽦?쒕떎**

~~~text
?섎せ??Authorization -> 401
Bearer CRON_SECRET -> purge_expired_events ?몄텧
留뚮즺 ???됱궗 -> ?좎?
留뚮즺 ?됱궗 -> PII? 媛쒖씤寃곌낵 ??젣, PURGED
??踰??몄텧 -> ??踰덉㎏???덉쟾?섍쾶 200
~~~

- [ ] **Step 4: ?뚯뒪???ㅽ뙣瑜??뺤씤?쒕떎**

Run: npx vitest run src/lib/realtime src/app/api/cron

Expected: 紐⑤뱢 ?놁쓬?쇰줈 FAIL.

- [ ] **Step 5: Broadcast? polling fallback??援ы쁽?쒕떎**

梨꾨꼸 ?대쫫? event:EVENT_ID:status, ?대깽???대쫫? state_changed瑜??ъ슜?쒕떎. ?뚮┝??諛쏆쑝硫?諛섎뱶???좏뵆由ъ??댁뀡 API?먯꽌 沅뚰븳??留욌뒗 理쒖떊 ?곹깭瑜??ㅼ떆 議고쉶?섎ŉ Broadcast payload瑜?理쒖쥌 ?곹깭濡??좊ː?섏? ?딅뒗??

- [ ] **Step 6: ?쇱씪 ??젣 ?묒뾽??援ъ꽦?쒕떎**

Create vercel.json:

~~~json
{
  "crons": [
    { "path": "/api/cron/purge", "schedule": "15 18 * * *" }
  ]
}
~~~

18:15 UTC???쒓뎅?쒓컙 ?ㅼ쓬 ??03:15?? 留뚮즺???곗씠?곕뒗 cron ?ㅽ뻾 ?꾩씠?쇰룄 議고쉶 API?먯꽌 利됱떆 李⑤떒?쒕떎.

- [ ] **Step 7: 寃利앺븯怨?而ㅻ컠?쒕떎**

~~~bash
npm run test:run
npm run typecheck
npm run lint
npm run build
git add src/lib/realtime src/features/participant src/app/api/cron vercel.json
git commit -m "feat: publish results and purge expired pii"
~~~

**Codex ?붿껌臾?**

~~~text
援ы쁽 怨꾪쉷 Task 10留??섑뻾?댁쨾. 媛쒖씤?뺣낫 ?녿뒗 ?곹깭 Broadcast, 李몄꽍???먮룞 寃곌낵 ?꾪솚, 5珥?polling fallback, 寃곌낵 怨듭쑀 ??7??留뚮즺 ?ㅼ젙, ?몄쬆???쇱씪 ??젣 cron???뚯뒪???곗꽑?쇰줈 援ы쁽?섍퀬 而ㅻ컠??
~~~

---

### Task 11: E2E쨌蹂댁븞쨌500紐?遺??寃利?

**Files:**
- Create: playwright.config.ts
- Create: tests/e2e/event-flow.spec.ts
- Create: tests/e2e/security.spec.ts
- Create: tests/load/entry.js
- Create: docs/test-report-template.md

**Interfaces:**
- Consumes: ?꾩꽦?????붾㈃怨?API
- Produces: npm run test:e2e? k6 ?ㅽ뻾 寃곌낵

- [ ] **Step 1: Playwright ?ㅼ젙???묒꽦?쒕떎**

~~~ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true
  },
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
    { name: "iphone-safari", use: { ...devices["iPhone 14"] } },
    { name: "android-chrome", use: { ...devices["Pixel 7"] } }
  ]
});
~~~

- [ ] **Step 2: ?꾩껜 ?됱궗 E2E瑜??묒꽦?쒕떎**

愿由ъ옄 濡쒓렇?? ?됱궗 ?ㅼ젙, ?묐え ?쒖옉, 35紐??묐え, 以묐났 李⑤떒, 留덇컧, 異붿꺼, ??寃쏀뭹 ?쒖감 怨듦컻, ??紐??泥?異붿꺼, 寃곌낵 怨듭쑀, ?뱀꺼쨌誘몃떦泥?媛쒖씤 ?붾㈃, ?뺥솗??30紐낆쓽 怨좎쑀 ?뱀꺼?먮? ???뚯뒪?몄뿉??寃利앺븳??

- [ ] **Step 3: 蹂댁븞 E2E瑜??묒꽦?쒕떎**

~~~text
?몄뀡 ?놁씠 admin API -> 401
?몄뀡 ?놁씠 display reveal -> 401
?ㅻⅨ 李멸????좏겙?쇰줈 蹂몄씤 ??寃곌낵 ?묎렐 遺덇?
怨듭쑀 ???뱀꺼 ?щ? 鍮꾧났媛?
?묐떟??service key, hash, ciphertext ?놁쓬
濡쒓렇??5???ㅽ뙣 ??429
~~~

- [ ] **Step 4: k6 吏묒쨷 ?묐え ?ㅽ겕由쏀듃瑜??묒꽦?쒕떎**

Create tests/load/entry.js:

~~~js
import http from "k6/http";
import { check } from "k6";

export const options = {
  scenarios: {
    burst: { executor: "shared-iterations", vus: 100, iterations: 500, maxDuration: "60s" }
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000"]
  }
};

export default function () {
  const id = String(__VU) + "-" + String(__ITER) + "-" + String(Date.now());
  const raw = (__VU * 1000 + __ITER) % 100000000;
  const phoneSuffix = String(raw).padStart(8, "0");
  const accessToken = id.padEnd(43, "x");
  const body = {
    name: "?뚯뒪?? + id,
    phone: "010" + phoneSuffix,
    department: "遺?섑뀒?ㅽ듃遺",
    privacyConsent: true,
    accessToken
  };
  const response = http.post(
    __ENV.BASE_URL + "/api/participants",
    JSON.stringify(body),
    { headers: { "Content-Type": "application/json" } }
  );
  check(response, { "?묐え ?깃났": (r) => r.status === 201 });
}
~~~

- [ ] **Step 5: ?꾩껜 寃利앹쓣 ?ㅽ뻾?쒕떎**

~~~bash
npm run test:run
npm run test:e2e
npm run typecheck
npm run lint
npm run build
k6 run -e BASE_URL=https://PREVIEW_DEPLOYMENT_URL tests/load/entry.js
~~~

Expected: unit/integration/E2E PASS, HTTP ?ㅽ뙣??1% 誘몃쭔, p95 3珥?誘몃쭔, ???李몄꽍??500紐? 以묐났 ?곕씫泥?0嫄? 濡쒓렇 ??媛쒖씤?뺣낫 0嫄?

- [ ] **Step 6: 寃곌낵瑜?湲곕줉?섍퀬 而ㅻ컠?쒕떎**

~~~bash
git add playwright.config.ts tests docs/test-report-template.md
git commit -m "test: verify prize draw end to end"
~~~

**Codex ?붿껌臾?**

~~~text
援ы쁽 怨꾪쉷 Task 11留??섑뻾?댁쨾. Playwright ?꾩껜 ?됱궗 ?먮쫫怨?沅뚰븳 ?뚯뒪?? k6 500嫄?吏묒쨷 ?묐え ?ㅽ겕由쏀듃瑜??꾩꽦?? ?ㅽ뙣媛 ?덉쑝硫??먯씤??怨좎퀜 紐⑤뱺 寃利앹쓣 ?ㅼ떆 ?ㅽ뻾?섍퀬 寃곌낵瑜?臾몄꽌?뷀븳 ??而ㅻ컠??
~~~

---

### Task 12: Vercel ?댁쁺 諛고룷? ?됱궗 由ы뿀??

**Files:**
- Create: docs/deployment.md
- Create: docs/event-day-checklist.md
- Create: docs/privacy-deletion-checklist.md
- Modify: README.md

**Interfaces:**
- Consumes: GitHub ??μ냼, ?댁쁺 Supabase, Vercel ?꾨줈?앺듃
- Produces: ?댁쁺 URL, ?댁쁺 QR, 諛고룷쨌蹂듦뎄쨌?됱궗 泥댄겕由ъ뒪??

- [ ] **Step 1: 諛고룷 臾몄꽌瑜??묒꽦?쒕떎**

~~~text
1. GitHub main 釉뚮옖移?理쒖떊??
2. ?댁쁺 Supabase ?꾨줈?앺듃 ?앹꽦
3. migration ?곸슜
4. ?댁쁺 ?섍꼍蹂???깅줉
5. Vercel Preview 諛고룷
6. Preview E2E? ?ㅻ쭏?명룿 ?ㅺ린湲??뺤씤
7. Production 諛고룷
8. Production QR ?앹꽦
9. 愿由ъ옄쨌媛뺤뿰??濡쒓렇???쒗뿕
10. ?뚯뒪???곗씠??利됱떆 ??젣
~~~

- [ ] **Step 2: ?댁쁺 鍮꾨?媛믪쓣 ?앹꽦?섍퀬 ?깅줉?쒕떎**

?ㅼ쓬 紐낅졊? 濡쒖뺄?먯꽌 ?ㅽ뻾?섍퀬 異쒕젰媛믪쓣 梨꾪똿?대굹 Git???④린吏 ?딅뒗??

~~~bash
node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" "愿由ъ옄媛_?뺥븳_怨듭슜鍮꾨?踰덊샇"
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
~~~

ADMIN_SESSION_SECRET, PII_ENCRYPTION_KEY, PHONE_HASH_SECRET, PARTICIPANT_TOKEN_HASH_SECRET, LOGIN_RATE_HASH_SECRET, CRON_SECRET? 媛곴컖 蹂꾨룄濡??앹꽦??Vercel ?섍꼍蹂?섏뿉留??깅줉?쒕떎.

- [ ] **Step 3: Supabase? Vercel???곌껐?쒕떎**

~~~bash
npx supabase login
npx supabase link --project-ref PROJECT_REF
npx supabase db push
npx vercel link
npx vercel
~~~

Preview 寃利????ъ슜???뱀씤??諛쏄퀬 ?ㅽ뻾:

~~~bash
npx vercel --prod
~~~

- [ ] **Step 4: ?됱궗 ?뱀씪 泥댄겕由ъ뒪?몃? ?묒꽦?쒕떎**

~~~text
愿由ъ옄 ?됱궗쨌寃쏀뭹 ?ㅼ젙 ?뺤씤
媛뺤뿰???명듃遺??꾩썝쨌?명꽣?력텰hrome ?꾩껜?붾㈃
?꾨줈?앺꽣 QR ?몄떇
iPhone Safari? Android Chrome ?쒗뿕 ?묐え
由ы뿀???곗씠????젣
?묐え ?쒖옉
?묐え 留덇컧怨?理쒖쥌 ?몄썝 ?뺤씤
異붿꺼 ?ㅽ뻾 ???뺤씤李???룆
寃쏀뭹蹂?Enter 怨듦컻
遺?곴꺽??諛쒖깮 ??媛쒕퀎 ?泥?異붿꺼
?꾩껜 怨듦컻 ??寃곌낵 怨듭쑀
???ㅻ쭏?명룿?먯꽌 寃곌낵 ?먮룞 ?꾪솚 ?뺤씤
媛쒖씤?뺣낫 ??젣 ?덉젙???뺤씤
7??????젣 ?꾨즺 ?뺤씤
~~~

- [ ] **Step 5: ?댁쁺 寃利앹쓣 ?ㅽ뻾?쒕떎**

~~~bash
npm run test:run
npm run test:e2e
npm run typecheck
npm run lint
npm run build
~~~

Production? ?ㅼ젣 iPhone Safari, Android Chrome ?먮뒗 ?쇱꽦 ?명꽣?? 媛뺤뿰???명듃遺겶룻봽濡쒖젥?곗뿉???섎룞 寃利앺븳??

- [ ] **Step 6: 理쒖쥌 臾몄꽌? 肄붾뱶瑜?而ㅻ컠?쒕떎**

~~~bash
git add README.md docs
git commit -m "docs: add deployment and event runbook"
git status --short
~~~

Expected: working tree clean.

**Codex ?붿껌臾?**

~~~text
援ы쁽 怨꾪쉷 Task 12留??섑뻾?댁쨾. 諛고룷 臾몄꽌? ?됱궗 ?뱀씪쨌媛쒖씤?뺣낫 ??젣 泥댄겕由ъ뒪?몃? ?꾩꽦?섍퀬 Preview 寃利앷퉴吏 吏꾪뻾?? Production 諛고룷??Preview ?뚯뒪??寃곌낵瑜?癒쇱? 蹂닿퀬?????닿? ?뱀씤?섎㈃ ?ㅽ뻾?? 鍮꾨?媛믪? ?붾㈃쨌濡쒓렇쨌Git???몄텧?섏? 留먭퀬 理쒖쥌 寃利앷낵 而ㅻ컠 寃곌낵瑜?蹂닿퀬??
~~~

---

## 3. ?꾩껜 ?꾨즺 ?먯젙

- 12媛?Task??而ㅻ컠??議댁옱?쒕떎.
- test:run, test:e2e, typecheck, lint, build媛 紐⑤몢 ?듦낵?쒕떎.
- 500嫄?吏묒쨷 ?묐え?먯꽌 ?꾨씫怨?以묐났???녾퀬 HTTP ?ㅽ뙣?⑥씠 1% 誘몃쭔?대떎.
- 20紐? 30紐? 35紐? 500紐??쒕굹由ъ삤?먯꽌 1??1寃쏀뭹怨?理쒕? 30紐??뱀꺼??吏耳쒖쭊??
- ?ㅼ틪湲곌린, ?釉붾윭, ?ㅻ낫???쒖꽌濡???紐낆뵫 怨듦컻?쒕떎.
- ?泥?異붿꺼? ?숈씪 寃쏀뭹????댁꽌留??ㅽ뻾?섍퀬 ?꾩껜 寃곌낵瑜?諛붽씀吏 ?딅뒗??
- 寃곌낵 怨듭쑀 ??媛쒖씤 寃곌낵媛 ?몄텧?섏? ?딅뒗??
- ?뱀꺼쨌誘몃떦泥??붾㈃???뱀씤??諛⑹슱???대?吏媛 ?쒖떆?쒕떎.
- 愿由ъ옄? 媛뺤뿰??API媛 怨듭슜 鍮꾨?踰덊샇 ?몄뀡 ?놁씠 ?ㅽ뻾?섏? ?딅뒗??
- ?대쫫, ?곕씫泥? 遺?쒕뒗 ?뷀샇?붾릺????λ릺怨?濡쒓렇???⑥? ?딅뒗??
- 寃곌낵 怨듭쑀 ??7??留뚮즺? ?먮룞 ??젣媛 寃利앸맂??
- ?ㅼ젣 iPhone, Android, 媛뺤뿰???명듃遺겶룻봽濡쒖젥??由ы뿀?ㅼ쓣 ?듦낵?쒕떎.

## 4. 怨듭떇 李멸퀬 臾몄꽌

- Next.js ?ㅼ튂: https://nextjs.org/docs/app/getting-started/installation
- Next.js App Router: https://nextjs.org/docs/app
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Supabase Realtime 援щ룆 諛⑹떇: https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs

