/**
 * movieId er prerequisites newPrereqIds kore dile cycle hobe kina?
 *
 * Ei function movies Map ta bodlay na. Shudhu pore dekhe.
 * Iterative DFS (stack), tai onek boro chain e o recursion limit e atkabe na.
 */
export function wouldCreateCycle(movieId, newPrereqIds, movies) {
  const visited = new Set();
  const stack = [...newPrereqIds];

  while (stack.length > 0) {
    const current = stack.pop();

    // Prerequisite chain e movieId pawa gelo, mane cycle
    if (current === movieId) return true;

    if (visited.has(current)) continue;
    visited.add(current);

    const movie = movies.get(current);
    if (movie) stack.push(...movie.prerequisites);
  }

  return false;
}