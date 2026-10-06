import { randomBytes } from "node:crypto";

const baseUrl = process.env.BASE_URL;
const expectedEventId = process.env.EXPECTED_EVENT_ID;
const total = Number(process.env.USERS ?? "400");

if (!baseUrl || !expectedEventId || total !== 400) {
  throw new Error("Set BASE_URL and EXPECTED_EVENT_ID; USERS must be 400.");
}

const preflightResponse = await fetch(new URL("/api/public/event", baseUrl), {
  headers: { accept: "application/json" },
  signal: AbortSignal.timeout(30_000),
});
const preflight = await preflightResponse.json();
if (
  !preflightResponse.ok ||
  preflight.id !== expectedEventId ||
  preflight.status !== "OPEN"
) {
  throw new Error("Preview event preflight failed; no participants were submitted.");
}

const started = performance.now();
const results = await Promise.all(
  Array.from({ length: total }, async (_, index) => {
    const sequence = String(index + 1).padStart(4, "0");
    const phoneSuffix = String(index + 1).padStart(4, "0");
    const payload = {
      name: `LOADTEST-${sequence}`,
      phone: `0109999${phoneSuffix}`,
      department: "LOADTEST-20261006",
      privacyConsent: true,
      accessToken: randomBytes(32).toString("base64url"),
    };
    const requestStarted = performance.now();
    try {
      const response = await fetch(new URL("/api/participants", baseUrl), {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000),
      });
      let body = null;
      try {
        body = await response.json();
      } catch {
        // A non-JSON response is reported as a failed registration below.
      }
      return {
        index,
        status: response.status,
        participantId:
          typeof body?.participantId === "string" ? body.participantId : null,
        latencyMs: performance.now() - requestStarted,
        valid:
          (response.status === 200 || response.status === 201) &&
          typeof body?.participantId === "string",
        errorCode: typeof body?.code === "string" ? body.code : undefined,
      };
    } catch (error) {
      return {
        index,
        status: 0,
        participantId: null,
        latencyMs: performance.now() - requestStarted,
        valid: false,
        errorCode: error instanceof Error ? error.name : "UnknownError",
      };
    }
  }),
);
const elapsedMs = performance.now() - started;
const latencies = results.map((result) => result.latencyMs).sort((a, b) => a - b);
const percentile = (p) =>
  Math.round(latencies[Math.ceil(p * latencies.length) - 1] ?? 0);
const statusCounts = Object.fromEntries(
  [...new Set(results.map((result) => result.status))]
    .sort((a, b) => a - b)
    .map((status) => [
      String(status),
      results.filter((result) => result.status === status).length,
    ]),
);
const createdIds = [
  ...new Set(
    results
      .map((result) => result.participantId)
      .filter((id) => typeof id === "string"),
  ),
];
const report = {
  target: new URL("/api/participants", baseUrl).origin,
  eventId: expectedEventId,
  requests: total,
  concurrency: total,
  successfulRegistrations: createdIds.length,
  invalidResponses: results.filter((result) => !result.valid).length,
  statusCounts,
  durationMs: Math.round(elapsedMs),
  latencyMs: {
    min: Math.round(latencies[0] ?? 0),
    p50: percentile(0.5),
    p95: percentile(0.95),
    p99: percentile(0.99),
    max: Math.round(latencies.at(-1) ?? 0),
  },
  errorCodes: results
    .filter((result) => !result.valid && result.errorCode)
    .slice(0, 10)
    .map((result) => ({ request: result.index + 1, code: result.errorCode })),
  createdIds,
};
console.log(JSON.stringify(report, null, 2));
if (report.successfulRegistrations !== total || report.invalidResponses > 0) {
  process.exitCode = 1;
}
