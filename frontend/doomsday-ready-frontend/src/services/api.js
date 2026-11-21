// UI shob kaj ei `api` object er moddhe diye kore.
//
// USE_DEMO_DATA = true  -> backend lage na, browser localStorage e kaj kore (ekhon eta)
// USE_DEMO_DATA = false -> /api/... e real backend call kore (vite.config.js e proxy set kora ache)
import { mockBackend, ApiError } from './mockBackend';

export { ApiError };
export const USE_DEMO_DATA = true;
const API_BASE_URL = '/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Is the backend running?');
  }
  if (!res.ok) {
    let body = {};
    try {
      body = await res.json();
    } catch {
      /* body json na hole ignore */
    }
    const code = typeof body.error === 'string' ? body.error : body.code;
    throw new ApiError(res.status, code, body.message || code || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Backend er response shape alada hole shudhu ei normalize function gulo thik korlei hobe.
function normalizeRewatch(data) {
  const order = Array.isArray(data) ? data : data.order ?? data.movies ?? [];
  return {
    order,
    watchedCount: data.watchedCount ?? order.filter((m) => m.watched).length,
    totalCount: data.totalCount ?? order.length,
    remainingRuntime:
      data.remainingRuntime ?? data.remainingRuntimeMinutes ?? order.filter((m) => !m.watched).reduce((s, m) => s + m.runtime, 0),
  };
}

function normalizeBooking(data) {
  if (data === null || data.possible === false) return { possible: false, totalBundles: 0, breakdown: [] };
  let breakdown = data.breakdown ?? data.bundles ?? [];
  if (!Array.isArray(breakdown)) {
    breakdown = Object.entries(breakdown).map(([size, count]) => ({ size: Number(size), count }));
  }
  breakdown = breakdown.map((b) => ({ size: Number(b.size), count: Number(b.count) })).sort((a, b) => b.size - a.size);
  return {
    possible: true,
    totalBundles: data.totalBundles ?? breakdown.reduce((s, b) => s + b.count, 0),
    breakdown,
  };
}

const real = {
  getMovies: () => request('/movies'),
  createMovie: (data) => request('/movies', { method: 'POST', body: JSON.stringify(data) }),
  updateMovie: (id, patch) => request(`/movies/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteMovie: (id) => request(`/movies/${id}`, { method: 'DELETE' }),
  getRewatchOrder: async (id) => normalizeRewatch(await request(`/movies/${id}/rewatch-order`)),
  getCinemas: () => request('/cinemas'),
  createCinema: (data) => request('/cinemas', { method: 'POST', body: JSON.stringify(data) }),
  getBooking: async (cinemaId, groupSize) =>
    normalizeBooking(await request(`/cinemas/${cinemaId}/booking?groupSize=${groupSize}`)),
};

const demo = {
  ...mockBackend,
  getRewatchOrder: async (id) => normalizeRewatch(await mockBackend.getRewatchOrder(id)),
  getBooking: async (cinemaId, groupSize) => normalizeBooking(await mockBackend.getBooking(cinemaId, groupSize)),
};

export const api = USE_DEMO_DATA ? demo : real;
