import test from "node:test";
import assert from "node:assert/strict";
import { wouldCreateCycle } from "../src/graph/cycle.js";
import { computeRewatchOrder } from "../src/graph/rewatchOrder.js";
import { findMinBundles } from "../src/booking/minBundles.js";

// Chhoto helper: { A: ["B"] } mane A er prerequisite B
function graph(spec) {
  const map = new Map();
  for (const [id, prerequisites] of Object.entries(spec)) {
    map.set(id, { id, title: id, runtime: 100, watched: false, prerequisites });
  }
  return map;
}

/* ---------- cycle detection ---------- */
test("cycle: self dependency", () => {
  assert.equal(wouldCreateCycle("A", ["A"], graph({ A: [] })), true);
});

test("cycle: direct (A needs B, B needs A)", () => {
  assert.equal(wouldCreateCycle("B", ["A"], graph({ A: ["B"], B: [] })), true);
});

test("cycle: indirect through a long chain", () => {
  const g = graph({ A: ["B"], B: ["C"], C: ["D"], D: [] });
  assert.equal(wouldCreateCycle("D", ["A"], g), true);
});

test("cycle: valid change is allowed", () => {
  const g = graph({ A: ["B"], B: [], C: [] });
  assert.equal(wouldCreateCycle("C", ["A"], g), false);
  assert.equal(wouldCreateCycle("A", [], g), false);
});

test("cycle: diamond shape is not a cycle", () => {
  const g = graph({ T: [], L: ["T"], R: ["T"], X: [] });
  assert.equal(wouldCreateCycle("X", ["L", "R"], g), false);
});

/* ---------- rewatch order ---------- */
test("rewatch: no prerequisites -> empty list", () => {
  assert.deepEqual(computeRewatchOrder("A", graph({ A: [] })), []);
});

test("rewatch: target not included, prerequisites come first", () => {
  const g = graph({ A: ["B", "C"], B: ["D"], C: ["D"], D: [] });
  const ids = computeRewatchOrder("A", g).map((m) => m.id);
  assert.ok(!ids.includes("A"));
  assert.equal(ids.length, 3);
  assert.equal(new Set(ids).size, 3); // D ekbar-i (diamond)
  assert.ok(ids.indexOf("D") < ids.indexOf("B"));
  assert.ok(ids.indexOf("D") < ids.indexOf("C"));
});

test("rewatch: very long chain does not crash (no recursion limit)", () => {
  const spec = {};
  const N = 20000;
  for (let i = 0; i < N; i++) spec[`m${i}`] = i === 0 ? [] : [`m${i - 1}`];
  const order = computeRewatchOrder(`m${N - 1}`, graph(spec));
  assert.equal(order.length, N - 1);
  assert.equal(order[0].id, "m0");
});

/* ---------- min bundles ---------- */
const fmt = (q) => q && q.breakdown.map((b) => `${b.size}x${b.count}`).join(",");

test("bundles: challenge examples", () => {
  assert.equal(findMinBundles([1, 3, 4], 6).totalBundles, 2);
  assert.equal(fmt(findMinBundles([1, 3, 4], 6)), "3x2");

  assert.equal(findMinBundles([2, 5], 11).totalBundles, 4);
  assert.equal(fmt(findMinBundles([2, 5], 11)), "5x1,2x3");

  assert.equal(findMinBundles([6, 9, 20], 44).totalBundles, 4);
  assert.equal(fmt(findMinBundles([6, 9, 20], 44)), "20x1,9x2,6x1");

  assert.equal(findMinBundles([4, 6], 7), null);
});

test("bundles: greedy would fail, DP wins", () => {
  // greedy 4+1+1 = 3 bundle, kintu 3+3 = 2 bundle
  assert.equal(findMinBundles([1, 3, 4], 6).totalBundles, 2);
});

test("bundles: edge cases", () => {
  assert.equal(findMinBundles([1], 1).totalBundles, 1);
  assert.equal(findMinBundles([500], 500).totalBundles, 1);
  assert.equal(findMinBundles([500], 499), null);
  assert.equal(findMinBundles([3], 10000), null); // 10000 3 diye bhag hoy na
});

test("bundles: sum of seats always equals group size", () => {
  const sizes = [7, 11, 13];
  for (let n = 1; n <= 300; n++) {
    const q = findMinBundles(sizes, n);
    if (q) {
      const seats = q.breakdown.reduce((s, b) => s + b.size * b.count, 0);
      const bundles = q.breakdown.reduce((s, b) => s + b.count, 0);
      assert.equal(seats, n);
      assert.equal(bundles, q.totalBundles);
    }
  }
});

test("bundles: max group size is fast", () => {
  const start = Date.now();
  const q = findMinBundles([1, 3, 4, 7, 11, 13, 17, 19, 23, 29], 10000);
  assert.ok(q);
  assert.ok(Date.now() - start < 500);
});