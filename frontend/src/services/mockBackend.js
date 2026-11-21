// Browser localStorage diye backend er moto kaj kore. Shudhu DEMO MODE er jonno.
// Error gulo real API er moto { status, code, message } shape e throw kore.
import { initialMovies, initialCinemas } from '../data/demoData.js';
import { wouldCreateCycle, rewatchOrder, bookingQuote } from '../utils/algorithms.js';

const MOVIES_KEY = 'dr-movies-v2';
const CINEMAS_KEY = 'dr-cinemas-v2';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return structuredClone(fallback);
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
const newId = (prefix) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function validateMovieFields(data, movies, selfId) {
  const title = String(data.title ?? '').trim();
  if (!title) throw new ApiError(400, 'VALIDATION_ERROR', 'Title is required.');
  const year = Number(data.releaseYear);
  if (!Number.isInteger(year) || year < 1888 || year > 2100)
    throw new ApiError(400, 'VALIDATION_ERROR', 'Release year must be between 1888 and 2100.');
  const runtime = Number(data.runtime);
  if (!Number.isInteger(runtime) || runtime < 1 || runtime > 300)
    throw new ApiError(400, 'VALIDATION_ERROR', 'Runtime must be between 1 and 300 minutes.');
  if (movies.some((m) => m.id !== selfId && m.title.toLowerCase() === title.toLowerCase()))
    throw new ApiError(409, 'DUPLICATE_TITLE', 'A movie with this title already exists.');
  return { title, releaseYear: year, runtime };
}

function validatePrereqs(prereqs, movies, selfId) {
  const unique = [...new Set(prereqs ?? [])];
  for (const p of unique) {
    if (!movies.some((m) => m.id === p))
      throw new ApiError(400, 'VALIDATION_ERROR', 'A selected prerequisite does not exist.');
  }
  if (selfId !== null && wouldCreateCycle(selfId, unique, movies))
    throw new ApiError(
      409,
      'CIRCULAR_DEPENDENCY',
      'CIRCULAR_DEPENDENCY: a movie cannot depend on itself, directly or through other movies.'
    );
  return unique;
}

export const mockBackend = {
  async getMovies() {
    await delay();
    return load(MOVIES_KEY, initialMovies);
  },

  async createMovie(data) {
    await delay();
    const movies = load(MOVIES_KEY, initialMovies);
    const fields = validateMovieFields(data, movies, null);
    const prerequisites = validatePrereqs(data.prerequisites, movies, null);
    // Notun movie er id keu depend kore na, tai create e cycle hoy na.
    const movie = { id: newId('m'), ...fields, prerequisites, watched: Boolean(data.watched) };
    save(MOVIES_KEY, [...movies, movie]);
    return movie;
  },

  async updateMovie(id, patch) {
    await delay(60);
    const movies = load(MOVIES_KEY, initialMovies);
    const current = movies.find((m) => m.id === id);
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Movie not found.');
    const merged = { ...current, ...patch };
    const fields = validateMovieFields(merged, movies, id);
    const prerequisites =
      patch.prerequisites !== undefined ? validatePrereqs(patch.prerequisites, movies, id) : current.prerequisites;
    const updated = { ...current, ...fields, prerequisites, watched: Boolean(merged.watched) };
    save(MOVIES_KEY, movies.map((m) => (m.id === id ? updated : m)));
    return updated;
  },

  async deleteMovie(id) {
    await delay(60);
    const movies = load(MOVIES_KEY, initialMovies);
    if (!movies.some((m) => m.id === id)) throw new ApiError(404, 'NOT_FOUND', 'Movie not found.');
    save(
      MOVIES_KEY,
      movies.filter((m) => m.id !== id).map((m) => ({ ...m, prerequisites: m.prerequisites.filter((p) => p !== id) }))
    );
  },

  async getRewatchOrder(id) {
    await delay(80);
    const movies = load(MOVIES_KEY, initialMovies);
    if (!movies.some((m) => m.id === id)) throw new ApiError(404, 'NOT_FOUND', 'Movie not found.');
    const order = rewatchOrder(id, movies);
    return {
      order,
      watchedCount: order.filter((m) => m.watched).length,
      totalCount: order.length,
      remainingRuntime: order.filter((m) => !m.watched).reduce((s, m) => s + m.runtime, 0),
    };
  },

  async getCinemas() {
    await delay();
    return load(CINEMAS_KEY, initialCinemas);
  },

  async createCinema(data) {
    await delay();
    const cinemas = load(CINEMAS_KEY, initialCinemas);
    const name = String(data.name ?? '').trim();
    if (!name) throw new ApiError(400, 'VALIDATION_ERROR', 'Cinema name is required.');
    if (cinemas.some((c) => c.name.toLowerCase() === name.toLowerCase()))
      throw new ApiError(409, 'DUPLICATE_NAME', 'A cinema with this name already exists.');
    const sizes = (data.bundleSizes ?? []).map(Number);
    if (sizes.length < 1 || sizes.length > 10)
      throw new ApiError(400, 'VALIDATION_ERROR', 'A cinema needs 1 to 10 different bundle sizes.');
    if (sizes.some((s) => !Number.isInteger(s) || s < 1 || s > 500))
      throw new ApiError(400, 'VALIDATION_ERROR', 'Each bundle size must be a whole number from 1 to 500.');
    if (new Set(sizes).size !== sizes.length)
      throw new ApiError(400, 'VALIDATION_ERROR', 'Bundle sizes must be different from each other.');
    const cinema = { id: newId('c'), name, bundleSizes: [...sizes].sort((a, b) => a - b) };
    save(CINEMAS_KEY, [...cinemas, cinema]);
    return cinema;
  },

  async getBooking(cinemaId, groupSize) {
    await delay(80);
    const cinemas = load(CINEMAS_KEY, initialCinemas);
    const cinema = cinemas.find((c) => c.id === cinemaId);
    if (!cinema) throw new ApiError(404, 'NOT_FOUND', 'Cinema not found.');
    const size = Number(groupSize);
    if (!Number.isInteger(size) || size < 1 || size > 10000)
      throw new ApiError(400, 'VALIDATION_ERROR', 'Group size must be a whole number from 1 to 10,000.');
    const quote = bookingQuote(cinema.bundleSizes, size);
    return quote
      ? { possible: true, groupSize: size, ...quote }
      : { possible: false, groupSize: size, totalBundles: 0, breakdown: [] };
  },

  async reset() {
    localStorage.removeItem(MOVIES_KEY);
    localStorage.removeItem(CINEMAS_KEY);
  },
};
