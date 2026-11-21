import { cinemas, newId } from "../store/db.js";
import { ApiError } from "../errors.js";

const bad = (message) => new ApiError(400, "VALIDATION_ERROR", message);

function parseName(v) {
  if (typeof v !== "string" || !v.trim()) throw bad("name is required");
  const name = v.trim();
  if (name.length > 200) throw bad("name must be 200 characters or fewer");
  return name;
}

function parseBundleSizes(v) {
  if (!Array.isArray(v)) throw bad("bundleSizes must be an array of numbers");
  if (v.length < 1 || v.length > 10) throw bad("bundleSizes must contain 1 to 10 sizes");
  for (const s of v) {
    if (!Number.isInteger(s) || s < 1 || s > 500) {
      throw bad("each bundle size must be a whole number between 1 and 500");
    }
  }
  if (new Set(v).size !== v.length) throw bad("bundle sizes must be different from each other");
  return [...v].sort((a, b) => a - b);
}

function assertNameUnique(name) {
  const lower = name.toLowerCase();
  for (const c of cinemas.values()) {
    if (c.name.toLowerCase() === lower) {
      throw new ApiError(409, "DUPLICATE_NAME", "A cinema with this name already exists");
    }
  }
}

export function listCinemas() {
  return [...cinemas.values()];
}

export function getCinema(id) {
  const cinema = cinemas.get(id);
  if (!cinema) throw new ApiError(404, "NOT_FOUND", "Cinema not found");
  return cinema;
}

export function createCinema(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw bad("request body must be a JSON object");
  }

  const name = parseName(body.name);
  const bundleSizes = parseBundleSizes(body.bundleSizes);
  assertNameUnique(name);

  const cinema = { id: newId(), name, bundleSizes };
  cinemas.set(cinema.id, cinema);
  return cinema;
}