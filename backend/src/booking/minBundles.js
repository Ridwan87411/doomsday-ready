/**
 * groupSize er soman exact seat banate fewest bundle khuje ber kore.
 *
 * sizes: bundle sizes, jemon [2, 5]
 * return: { totalBundles, breakdown: [{ size, count }] }, ba exact milano na gele null
 */
export function findMinBundles(sizes, groupSize) {
  const dp = new Array(groupSize + 1).fill(Infinity); // dp[n] = n seat er jonno min bundle
  const used = new Array(groupSize + 1).fill(0); //     used[n] = oi min e kon size lagse
  dp[0] = 0;

  for (let n = 1; n <= groupSize; n++) {
    for (const size of sizes) {
      if (size <= n && dp[n - size] + 1 < dp[n]) {
        dp[n] = dp[n - size] + 1;
        used[n] = size;
      }
    }
  }

  if (dp[groupSize] === Infinity) return null;

  // Pichone follow kore koyta kon size gunbo
  const counts = new Map();
  for (let remaining = groupSize; remaining > 0; remaining -= used[remaining]) {
    const size = used[remaining];
    counts.set(size, (counts.get(size) ?? 0) + 1);
  }

  const breakdown = [...counts.entries()]
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.size - a.size); // boro size age

  return { totalBundles: dp[groupSize], breakdown };
}