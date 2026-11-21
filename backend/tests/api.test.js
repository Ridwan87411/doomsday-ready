import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { resetStore } from "../src/store/db.js";
import { seedData } from "../src/store/seed.js";

let server;
let base;

before(async () => {
  server = createApp().listen(0); // 0 = faka port, dev server er sathe conflict hoy na
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

beforeEach(() => {
  resetStore();
  seedData();
});

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function movieId(title) {
  const { body } = await call("GET", "/movies");
  return body.find((m) => m.title === title).id;
}
async function cinemaId(name) {
  const { body } = await call("GET", "/cinemas");
  return body.find((c) => c.name === name).id;
}

/* ---------- health / 404 ---------- */
test("health and unknown route", async () => {
  assert.deepEqual((await call("GET", "/health")).body, { status: "ok" });
  const r = await call("GET", "/nothing");
  assert.equal(r.status, 404);
  assert.equal(r.body.error, "NOT_FOUND");
});

test("invalid JSON body -> 400", async () => {
  const r = await call("POST", "/movies", "{bad json");
  assert.equal(r.status, 400);
  assert.equal(r.body.error, "VALIDATION_ERROR");
});

/* ---------- movies ---------- */
test("GET /movies returns the 8 seed movies", async () => {
  const r = await call("GET", "/movies");
  assert.equal(r.status, 200);
  assert.equal(r.body.length, 8);
});

test("POST /movies creates with defaults", async () => {
  const r = await call("POST", "/movies", { title: "Black Widow", releaseYear: 2021, runtime: 134 });
  assert.equal(r.status, 201);
  assert.equal(r.body.watched, false);
  assert.deepEqual(r.body.prerequisites, []);
});

test("POST /movies validation", async () => {
  const bad = [
    { releaseYear: 2020, runtime: 100 },
    { title: "  ", releaseYear: 2020, runtime: 100 },
    { title: "A", releaseYear: 2020, runtime: 0 },
    { title: "A", releaseYear: 2020, runtime: 301 },
    { title: "A", releaseYear: 2020, runtime: 99.5 },
    { title: "A", releaseYear: "2020", runtime: 100 },
    { title: "A", releaseYear: 2020, runtime: 100, prerequisites: ["nope"] },
    { title: "A", releaseYear: 2020, runtime: 100, watched: "yes" },
  ];
  for (const body of bad) {
    const r = await call("POST", "/movies", body);
    assert.equal(r.status, 400, JSON.stringify(body));
    assert.equal(r.body.error, "VALIDATION_ERROR");
  }
});

test("POST /movies runtime boundaries 1 and 300 are valid", async () => {
  assert.equal((await call("POST", "/movies", { title: "Short", releaseYear: 2020, runtime: 1 })).status, 201);
  assert.equal((await call("POST", "/movies", { title: "Long", releaseYear: 2020, runtime: 300 })).status, 201);
});

test("duplicate title (case-insensitive) -> 409", async () => {
  const r = await call("POST", "/movies", { title: "iron man", releaseYear: 2008, runtime: 126 });
  assert.equal(r.status, 409);
  assert.equal(r.body.error, "DUPLICATE_TITLE");
});

test("PATCH watched and prerequisites", async () => {
  const id = await movieId("Thor: Ragnarok");
  const ironMan = await movieId("Iron Man");
  let r = await call("PATCH", `/movies/${id}`, { watched: true });
  assert.equal(r.status, 200);
  assert.equal(r.body.watched, true);
  r = await call("PATCH", `/movies/${id}`, { prerequisites: [ironMan] });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.prerequisites, [ironMan]);
});

test("PATCH unknown id -> 404, bad value -> 400, duplicate title -> 409", async () => {
  assert.equal((await call("PATCH", "/movies/wrong-id", { watched: true })).status, 404);
  const id = await movieId("Iron Man");
  assert.equal((await call("PATCH", `/movies/${id}`, { runtime: 500 })).status, 400);
  assert.equal((await call("PATCH", `/movies/${id}`, { title: "The Avengers" })).status, 409);
});

test("PATCH rename to own title is fine", async () => {
  const id = await movieId("Iron Man");
  assert.equal((await call("PATCH", `/movies/${id}`, { title: "Iron Man" })).status, 200);
});

/* ---------- circular dependency ---------- */
test("Iron Man <- Endgame is 409 CIRCULAR_DEPENDENCY and nothing changes", async () => {
  const ironMan = await movieId("Iron Man");
  const endgame = await movieId("Avengers: Endgame");
  const r = await call("PATCH", `/movies/${ironMan}`, { prerequisites: [endgame] });
  assert.equal(r.status, 409);
  assert.equal(r.body.error, "CIRCULAR_DEPENDENCY");
  const after = (await call("GET", "/movies")).body.find((m) => m.id === ironMan);
  assert.deepEqual(after.prerequisites, []);
});

test("self dependency is 409", async () => {
  const id = await movieId("Iron Man");
  const r = await call("PATCH", `/movies/${id}`, { prerequisites: [id] });
  assert.equal(r.status, 409);
  assert.equal(r.body.error, "CIRCULAR_DEPENDENCY");
});

test("a cycle created in two steps is blocked on the second", async () => {
  const thor = await movieId("Thor: Ragnarok");
  const ironMan = await movieId("Iron Man");
  assert.equal((await call("PATCH", `/movies/${thor}`, { prerequisites: [ironMan] })).status, 200);
  const r = await call("PATCH", `/movies/${ironMan}`, { prerequisites: [thor] });
  assert.equal(r.status, 409);
});

/* ---------- rewatch order ---------- */
test("rewatch order for Doomsday", async () => {
  const id = await movieId("Avengers: Doomsday");
  const r = await call("GET", `/movies/${id}/rewatch-order`);
  assert.equal(r.status, 200);
  assert.equal(r.body.totalCount, 7);
  assert.equal(r.body.watchedCount, 0);
  assert.equal(r.body.remainingRuntime, 1000);
  const titles = r.body.order.map((m) => m.title);
  assert.ok(!titles.includes("Avengers: Doomsday"));
  assert.equal(new Set(titles).size, 7);
  const pos = new Map(r.body.order.map((m, i) => [m.id, i]));
  for (const m of r.body.order) for (const p of m.prerequisites) assert.ok(pos.get(p) < pos.get(m.id));
});

test("rewatch order for Civil War and Ragnarok", async () => {
  const cw = await call("GET", `/movies/${await movieId("Captain America: Civil War")}/rewatch-order`);
  const titles = cw.body.order.map((m) => m.title);
  assert.equal(titles[2], "The Avengers");
  assert.deepEqual(titles.slice(0, 2).sort(), ["Captain America: The First Avenger", "Iron Man"]);

  const thor = await call("GET", `/movies/${await movieId("Thor: Ragnarok")}/rewatch-order`);
  assert.deepEqual(thor.body.order, []);
  assert.equal(thor.body.remainingRuntime, 0);
});

test("rewatch stats change when movies are marked watched", async () => {
  const doom = await movieId("Avengers: Doomsday");
  await call("PATCH", `/movies/${await movieId("Iron Man")}`, { watched: true });
  const r = await call("GET", `/movies/${doom}/rewatch-order`);
  assert.equal(r.body.watchedCount, 1);
  assert.equal(r.body.remainingRuntime, 1000 - 126);
});

test("rewatch order for unknown id -> 404", async () => {
  assert.equal((await call("GET", "/movies/wrong-id/rewatch-order")).status, 404);
});

/* ---------- delete ---------- */
test("DELETE removes movie and cleans prerequisites", async () => {
  const avengers = await movieId("The Avengers");
  const cw = await movieId("Captain America: Civil War");
  assert.equal((await call("DELETE", `/movies/${avengers}`)).status, 204);
  const movies = (await call("GET", "/movies")).body;
  assert.equal(movies.length, 7);
  assert.deepEqual(movies.find((m) => m.id === cw).prerequisites, []);
  assert.equal((await call("DELETE", `/movies/${avengers}`)).status, 404);
});

/* ---------- cinemas ---------- */
test("GET /cinemas returns 4 seed cinemas", async () => {
  assert.equal((await call("GET", "/cinemas")).body.length, 4);
});

test("POST /cinemas creates and sorts sizes", async () => {
  const r = await call("POST", "/cinemas", { name: "Test Plex", bundleSizes: [5, 2] });
  assert.equal(r.status, 201);
  assert.deepEqual(r.body.bundleSizes, [2, 5]);
});

test("POST /cinemas validation", async () => {
  const bad = [
    { bundleSizes: [2] },
    { name: "A" },
    { name: "A", bundleSizes: [] },
    { name: "A", bundleSizes: [2, 2] },
    { name: "A", bundleSizes: [0] },
    { name: "A", bundleSizes: [501] },
    { name: "A", bundleSizes: [1.5] },
    { name: "A", bundleSizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  ];
  for (const body of bad) {
    const r = await call("POST", "/cinemas", body);
    assert.equal(r.status, 400, JSON.stringify(body));
  }
  assert.equal((await call("POST", "/cinemas", { name: "Ten", bundleSizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] })).status, 201);
  assert.equal((await call("POST", "/cinemas", { name: "Big", bundleSizes: [500] })).status, 201);
});

test("duplicate cinema name -> 409", async () => {
  const r = await call("POST", "/cinemas", { name: "grand screen", bundleSizes: [3] });
  assert.equal(r.status, 409);
  assert.equal(r.body.error, "DUPLICATE_NAME");
});

/* ---------- booking ---------- */
async function quote(cinema, size) {
  return call("GET", `/cinemas/${await cinemaId(cinema)}/booking?groupSize=${size}`);
}

test("booking: challenge examples", async () => {
  let r = await quote("Grand Screen", 6);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { possible: true, groupSize: 6, totalBundles: 2, breakdown: [{ size: 3, count: 2 }] });

  r = await quote("Starlight Cinemas", 11);
  assert.equal(r.body.totalBundles, 4);
  assert.deepEqual(r.body.breakdown, [{ size: 5, count: 1 }, { size: 2, count: 3 }]);

  r = await quote("Metro Cineplex", 44);
  assert.equal(r.body.totalBundles, 4);
  assert.deepEqual(r.body.breakdown, [{ size: 20, count: 1 }, { size: 9, count: 2 }, { size: 6, count: 1 }]);

  r = await quote("Galaxy Multiplex", 7);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { possible: false, groupSize: 7, totalBundles: 0, breakdown: [] });
});

test("booking: groupSize boundaries and validation", async () => {
  assert.equal((await quote("Grand Screen", 1)).body.totalBundles, 1);
  const max = await quote("Grand Screen", 10000);
  assert.equal(max.status, 200);
  assert.equal(max.body.totalBundles, 2500);
  for (const bad of ["0", "10001", "abc", "6.5", "-3", "", "6abc"]) {
    assert.equal((await quote("Grand Screen", bad)).status, 400, `groupSize=${bad}`);
  }
  const noParam = await call("GET", `/cinemas/${await cinemaId("Grand Screen")}/booking`);
  assert.equal(noParam.status, 400);
});

test("booking: unknown cinema -> 404", async () => {
  assert.equal((await call("GET", "/cinemas/wrong-id/booking?groupSize=6")).status, 404);
});