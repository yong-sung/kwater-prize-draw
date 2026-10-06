const baseUrl = process.env.BASE_URL;
const expectedEventId = process.env.EXPECTED_EVENT_ID;
const total = Number(process.env.USERS ?? "400");
const concurrency = Number(process.env.CONCURRENCY ?? String(total));

if (!baseUrl || !expectedEventId || total !== 400 || concurrency !== 400) {
  throw new Error("Set BASE_URL, EXPECTED_EVENT_ID and both USERS/CONCURRENCY to 400.");
}

const started = performance.now();
const results = await Promise.all(
  Array.from({ length: concurrency }, async (_, index) => {
    const requestStarted = performance.now();
    try {
      const response = await fetch(new URL("/api/public/event", baseUrl), {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(60_000),
      });
      let body = null;
      try {
        body = await response.json();
      } catch {
        // Count non-JSON responses as invalid payloads below.
      }
      return {
        index,
        status: response.status,
        latencyMs: performance.now() - requestStarted,
        valid:
          response.ok &&
          body?.id === expectedEventId &&
          Number.isInteger(body?.participantCount),
      };
    } catch (error) {
      return {
        index,
        status: 0,
        latencyMs: performance.now() - requestStarted,
        valid: false,
        error: error instanceof Error ? error.name : "UnknownError",
      };
    }
  }),
);
const elapsedMs = performance.now() - started;
const latencies = results.map((result) => result.latencyMs).sort((a, b) => a - b);
const percentile = (p) => Math.round(latencies[Math.ceil(p * latencies.length) - 1] ?? 0);
const statusCounts = Object.fromEntries(
  [...new Set(results.map((result) => result.status))]
    .sort((a, b) => a - b)
    .map((status) => [String(status), results.filter((result) => result.status === status).length]),
);
const report = {
  target: new URL("/api/public/event", baseUrl).origin,
  eventId: expectedEventId,
  requests: total,
  concurrentRequests: concurrency,
  durationMs: Math.round(elapsedMs),
  statusCounts,
  invalidResponses: results.filter((result) => !result.valid).length,
  latencyMs: {
    min: Math.round(latencies[0] ?? 0),
    p50: percentile(0.5),
    p95: percentile(0.95),
    p99: percentile(0.99),
    max: Math.round(latencies.at(-1) ?? 0),
  },
  networkErrors: results
    .filter((result) => result.error)
    .slice(0, 10)
    .map((result) => ({ request: result.index + 1, error: result.error })),
};
console.log(JSON.stringify(report, null, 2));
if (report.invalidResponses > 0) process.exitCode = 1;
