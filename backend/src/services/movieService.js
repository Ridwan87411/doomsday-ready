import { movies, newId } from "../store/db.js";
import { ApiError } from "../errors.js";
import { wouldCreateCycle } from "../graph/cycle.js";
import { computeRewatchOrder } from "../graph/rewatchOrder.js";

const bad = (message) => new ApiError(400, "VALIDATION_ERROR", message);

/* ---------- field validators ---------- */
function parseTitle(v) {
  if (typeof v !== "string" || !v.trim()) throw bad("title is required");
  const title = v.trim();
  if (title.length > 200) throw bad("title must be 200 characters or fewer");
  return title;
}

function parseYear(v) {
  if (!Number.isInteger(v) || v < 1888 || v > 2100) {
    throw bad("releaseYear must be a whole number between 1888 and 2100");
  }
  return v;
}

function parseRuntime(v) {
  if (!Number.isInteger(v) || v < 1 || v > 300) {
    throw bad("runtime must be a whole number between 1 and 300");
  }
  return v;
}

function parseWatched(v) {
  if (typeof v !== "boolean") throw bad("watched must be true or false");
  return v;
}

function parsePrerequisites(v) {
  if (!Array.isArray(v) || v.some((id) => typeof id !== "string")) {
    throw bad("prerequisites must be an array of movie ids");
  }
  const unique = [...new Set(v)]; // duplicate id thakle ekbar rakho
  for (const id of unique) {
    if (!movies.has(id)) throw bad(`prerequisite movie not found: ${id}`);
  }
  return unique;
}

function assertTitleUnique(title, exceptId) {
  const lower = title.toLowerCase();
  for (const m of movies.values()) {
    if (m.id !== exceptId && m.title.toLowerCase() === lower) {
      throw new ApiError(409, "DUPLICATE_TITLE", "A movie with this title already exists");
    }
  }
}

function assertObject(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw bad("request body must be a JSON object");
  }
}

/* ---------- operations ---------- */
export function listMovies() {
  return [...movies.values()];
}

export function getMovie(id) {
  const movie = movies.get(id);
  if (!movie) throw new ApiError(404, "NOT_FOUND", "Movie not found");
  return movie;
}

export function createMovie(body) {
  assertObject(body);

  const title = parseTitle(body.title);
  const releaseYear = parseYear(body.releaseYear);
  const runtime = parseRuntime(body.runtime);
  const prerequisites = body.prerequisites === undefined ? [] : parsePrerequisites(body.prerequisites);
  const watched = body.watched === undefined ? false : parseWatched(body.watched);

  assertTitleUnique(title, null);

  const movie = { id: newId(), title, releaseYear, runtime, prerequisites, watched };
  movies.set(movie.id, movie);
  return movie;
}

export function updateMovie(id, body) {
  assertObject(body);
  const current = getMovie(id);

  const next = { ...current };
  if (body.title !== undefined) next.title = parseTitle(body.title);
  if (body.releaseYear !== undefined) next.releaseYear = parseYear(body.releaseYear);
  if (body.runtime !== undefined) next.runtime = parseRuntime(body.runtime);
  if (body.watched !== undefined) next.watched = parseWatched(body.watched);
  if (body.prerequisites !== undefined) next.prerequisites = parsePrerequisites(body.prerequisites);

    if (next.title !== current.title) assertTitleUnique(next.title, id);

  // Cycle check: shob field validate hoyar por, save korar age
  if (body.prerequisites !== undefined && wouldCreateCycle(id, next.prerequisites, movies)) {
    throw new ApiError(
      409,
      "CIRCULAR_DEPENDENCY",
      "A movie cannot depend on itself, directly or through other movies"
    );
  }

  // Shob validation pass korle tarpor-i save kori
  movies.set(id, next);
  return next;
}

export function getRewatchPlan(id) {
  const target = getMovie(id); // na thakle 404

  const order = computeRewatchOrder(id, movies);
  const unwatched = order.filter((m) => !m.watched);

  return {
    order,
    watchedCount: order.length - unwatched.length,
    totalCount: order.length,
    remainingRuntime: unwatched.reduce((sum, m) => sum + m.runtime, 0),
  };
}

export function deleteMovie(id) {
  getMovie(id); // na thakle 404

  movies.delete(id);

  // Onno movie er prerequisite list theke ei movie ke soriye dao
  for (const m of movies.values()) {
    if (m.prerequisites.includes(id)) {
      m.prerequisites = m.prerequisites.filter((p) => p !== id);
    }
  }
}