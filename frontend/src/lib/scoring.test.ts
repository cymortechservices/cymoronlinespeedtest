import test from "node:test";
import assert from "node:assert/strict";
import { computeScore, labelFor } from "./scoring.ts";
import { latencyStats, toMbps } from "./stats.ts";
import { evaluateGaming, evaluateStreaming } from "./usecases.ts";

test("toMbps matches the documented formula", () => {
  assert.equal(toMbps(12_500_000, 1000), 100);
});

test("latency stats and jitter", () => {
  const s = latencyStats([10, 20, 10, 20]);
  assert.equal(s.minMs, 10);
  assert.equal(s.maxMs, 20);
  assert.equal(s.avgMs, 15);
  assert.equal(s.jitterMs, 10);
});

test("score is deterministic and bounded", () => {
  const input = { downloadMbps: 87.42, uploadMbps: 21.63, ping: { avgMs: 18, jitterMs: 4.2, requestLossPercent: 0 } };
  assert.deepEqual(computeScore(input), computeScore(input));
  const s = computeScore(input);
  assert.ok(s.total >= 0 && s.total <= 100);
  assert.equal(s.total, 91);
  assert.equal(computeScore({ downloadMbps: 0, uploadMbps: 0, ping: { avgMs: 999, jitterMs: 999, requestLossPercent: 100 } }).total, 0);
});

test("labels", () => {
  assert.equal(labelFor(90), "Excellent");
  assert.equal(labelFor(75), "Very Good");
  assert.equal(labelFor(10), "Poor");
});

test("use cases", () => {
  assert.equal(evaluateGaming({ down: 100, up: 20, ping: 18, jitter: 4, loss: 0 }).rating, "Excellent");
  assert.equal(evaluateGaming({ down: 100, up: 20, ping: 150, jitter: 4, loss: 0 }).rating, "Poor");
  assert.equal(evaluateStreaming({ down: 30, up: 1, ping: 20, jitter: 2, loss: 0 }).rating, "Good");
});
