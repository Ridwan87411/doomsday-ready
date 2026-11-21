/**
 * targetId er shob prerequisite (nested shoho), protita ekbar,
 * prerequisite age ashe emon order e. Target nijeke bad.
 */
export function computeRewatchOrder(targetId, movies) {
  const target = movies.get(targetId);
  if (!target) return [];

  const visited = new Set([targetId]);
  const order = [];
  // Prottek frame: ekta movie + tar prerequisite list er kon index porjonto dekha holo
  const stack = [{ movie: target, next: 0 }];

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];

    if (frame.next < frame.movie.prerequisites.length) {
      const prereqId = frame.movie.prerequisites[frame.next];
      frame.next += 1;

      if (visited.has(prereqId)) continue; // ager ekbar dekha hoyeche
      const prereq = movies.get(prereqId);
      if (!prereq) continue;

      visited.add(prereqId);
      stack.push({ movie: prereq, next: 0 });
    } else {
      // Ei movie r shob prerequisite shesh, ekhon list e rakhi
      stack.pop();
      if (frame.movie.id !== targetId) order.push(frame.movie);
    }
  }

  return order;
}