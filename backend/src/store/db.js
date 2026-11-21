import { randomUUID } from "node:crypto";

// In-memory storage. Server restart hole data jabe, tai seed lagbe.
export const movies = new Map(); // id -> movie
export const cinemas = new Map(); // id -> cinema

export function newId() {
  return randomUUID();
}

export function resetStore() {
  movies.clear();
  cinemas.clear();
}