// Pure helper functions (no React). Ei logic ta shudhu DEMO MODE er jonno.
// Asol assessment e eigulo backend e likhte hobe; real backend connect hole
// frontend e ar eigulo use hobe na.

/** newPrereqs set korle movieId cycle e porbe kina? (self-dependency o dhora porbe) */
export function wouldCreateCycle(movieId, newPrereqs, movies) {
  const byId = new Map(movies.map((m) => [m.id, m]));
  const visited = new Set();
  const stack = [...newPrereqs];
  while (stack.length) {
    const cur = stack.pop();
    if (cur === movieId) return true;
    if (visited.has(cur)) continue;
    visited.add(cur);
    stack.push(...(byId.get(cur)?.prerequisites ?? []));
  }
  return false;
}

/** Target er shob prerequisite, protita ekbar, prerequisite age. Target nijeke bad. */
export function rewatchOrder(targetId, movies) {
  const byId = new Map(movies.map((m) => [m.id, m]));
  const target = byId.get(targetId);
  if (!target) return [];
  const visited = new Set([targetId]);
  const order = [];
  const dfs = (id) => {
    if (visited.has(id)) return;
    visited.add(id);
    const m = byId.get(id);
    if (!m) return;
    m.prerequisites.forEach(dfs);
    order.push(m);
  };
  target.prerequisites.forEach(dfs);
  return order;
}

/** Fewest bundles diye exact groupSize. Possible na hole null. */
export function bookingQuote(sizes, groupSize) {
  const dp = new Array(groupSize + 1).fill(Infinity);
  const used = new Array(groupSize + 1).fill(0);
  dp[0] = 0;
  for (let i = 1; i <= groupSize; i++) {
    for (const s of sizes) {
      if (s <= i && dp[i - s] + 1 < dp[i]) {
        dp[i] = dp[i - s] + 1;
        used[i] = s;
      }
    }
  }
  if (dp[groupSize] === Infinity) return null;
  const counts = {};
  for (let r = groupSize; r > 0; r -= used[r]) counts[used[r]] = (counts[used[r]] ?? 0) + 1;
  const breakdown = Object.entries(counts)
    .map(([size, count]) => ({ size: Number(size), count }))
    .sort((a, b) => b.size - a.size);
  return { totalBundles: dp[groupSize], breakdown };
}

export function formatDuration(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return { h, m };
}
