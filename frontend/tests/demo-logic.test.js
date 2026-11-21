// Demo logic er test (challenge er expected result gulo). Run: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { initialMovies } from '../src/data/demoData.js';
import { rewatchOrder, wouldCreateCycle, bookingQuote } from '../src/utils/algorithms.js';

const byTitle = (t) => initialMovies.find((m) => m.title === t).id;
const titles = (list) => list.map((m) => m.title);

test('rewatch order for Doomsday = 7 movies, prerequisites first, each once', () => {
  const order = rewatchOrder(byTitle('Avengers: Doomsday'), initialMovies);
  assert.equal(order.length, 7);
  assert.equal(new Set(order.map((m) => m.id)).size, 7);
  assert.ok(!titles(order).includes('Avengers: Doomsday'));
  const pos = new Map(order.map((m, i) => [m.id, i]));
  for (const m of order) for (const p of m.prerequisites) assert.ok(pos.get(p) < pos.get(m.id));
});

test('rewatch order for Civil War and Ragnarok', () => {
  const cw = titles(rewatchOrder(byTitle('Captain America: Civil War'), initialMovies));
  assert.equal(cw[2], 'The Avengers');
  assert.deepEqual(cw.slice(0, 2).sort(), ['Captain America: The First Avenger', 'Iron Man']);
  assert.deepEqual(rewatchOrder(byTitle('Thor: Ragnarok'), initialMovies), []);
});

test('cycle detection', () => {
  assert.equal(wouldCreateCycle(byTitle('Iron Man'), [byTitle('Avengers: Endgame')], initialMovies), true);
  assert.equal(wouldCreateCycle(byTitle('Iron Man'), [byTitle('Iron Man')], initialMovies), true);
  assert.equal(wouldCreateCycle(byTitle('Thor: Ragnarok'), [byTitle('Iron Man')], initialMovies), false);
});

test('booking quotes', () => {
  const fmt = (q) => q && q.breakdown.map((b) => `${b.size}x${b.count}`).join(',');
  assert.equal(bookingQuote([1, 3, 4], 6).totalBundles, 2);
  assert.equal(fmt(bookingQuote([1, 3, 4], 6)), '3x2');
  assert.equal(bookingQuote([2, 5], 11).totalBundles, 4);
  assert.equal(fmt(bookingQuote([2, 5], 11)), '5x1,2x3');
  assert.equal(bookingQuote([6, 9, 20], 44).totalBundles, 4);
  assert.equal(fmt(bookingQuote([6, 9, 20], 44)), '20x1,9x2,6x1');
  assert.equal(bookingQuote([4, 6], 7), null);
  assert.ok(bookingQuote([1, 3, 4], 10000));
});
