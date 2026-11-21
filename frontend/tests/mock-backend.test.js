import test from 'node:test';
import assert from 'node:assert/strict';

// localStorage shim (node e nai)
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const { mockBackend } = await import('../src/services/mockBackend.js');

test('PATCH that creates a cycle -> 409 CIRCULAR_DEPENDENCY', async () => {
  const movies = await mockBackend.getMovies();
  const ironMan = movies.find((m) => m.title === 'Iron Man');
  const endgame = movies.find((m) => m.title === 'Avengers: Endgame');
  await assert.rejects(mockBackend.updateMovie(ironMan.id, { prerequisites: [endgame.id] }), (e) => e.status === 409 && e.code === 'CIRCULAR_DEPENDENCY');
  await assert.rejects(mockBackend.updateMovie(ironMan.id, { prerequisites: [ironMan.id] }), (e) => e.code === 'CIRCULAR_DEPENDENCY');
});

test('create movie validation + duplicate title', async () => {
  await assert.rejects(mockBackend.createMovie({ title: 'X', releaseYear: 2020, runtime: 301 }), (e) => e.status === 400);
  await assert.rejects(mockBackend.createMovie({ title: 'iron man', releaseYear: 2020, runtime: 100 }), (e) => e.status === 409);
  const m = await mockBackend.createMovie({ title: 'Black Widow', releaseYear: 2021, runtime: 134, prerequisites: [] });
  assert.equal(m.watched, false);
});

test('watched toggle persists and affects rewatch stats', async () => {
  const movies = await mockBackend.getMovies();
  const doom = movies.find((m) => m.title === 'Avengers: Doomsday');
  const before = await mockBackend.getRewatchOrder(doom.id);
  assert.equal(before.totalCount, 7);
  assert.equal(before.watchedCount, 3);
  assert.equal(before.remainingRuntime, 147 + 130 + 149 + 181);
  const thor = movies.find((m) => m.title === 'Thor: Ragnarok');
  await mockBackend.updateMovie(thor.id, { watched: true });
  const after = await mockBackend.getRewatchOrder(doom.id);
  assert.equal(after.watchedCount, 4);
  assert.equal(after.remainingRuntime, 147 + 149 + 181);
});

test('cinemas + booking', async () => {
  await assert.rejects(mockBackend.createCinema({ name: 'Bad', bundleSizes: [] }), (e) => e.status === 400);
  await assert.rejects(mockBackend.createCinema({ name: 'Bad', bundleSizes: [2, 2] }), (e) => e.status === 400);
  await assert.rejects(mockBackend.createCinema({ name: 'Bad', bundleSizes: [501] }), (e) => e.status === 400);
  await assert.rejects(mockBackend.createCinema({ name: 'grand screen', bundleSizes: [3] }), (e) => e.status === 409);
  const cinemas = await mockBackend.getCinemas();
  const palace = cinemas.find((c) => c.name === 'Galaxy Multiplex'); // [4,6]
  const r = await mockBackend.getBooking(palace.id, 7);
  assert.equal(r.possible, false);
  await assert.rejects(mockBackend.getBooking(palace.id, 0), (e) => e.status === 400);
  await assert.rejects(mockBackend.getBooking(palace.id, 10001), (e) => e.status === 400);
});
