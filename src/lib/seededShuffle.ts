/**
 * Creates a predictable pseudo-random number generator based on a seed.
 */
function createRandomGenerator(seed: number): () => number {
  // Scramble the seed using a MurmurHash3-like 32-bit mixer
  // to ensure consecutive seeds result in wildly different random streams.
  let h = seed ^ 0xdeadbeef;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  let currentSeed = (h ^ (h >>> 16)) >>> 0;

  return function() {
    // Standard LCG Math parameters used by runtime engines
    currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
    return currentSeed / 4294967296;
  };
}

/**
 * Shuffles an array predictably using a locked seed number.
 */
export function seededShuffle<T>(array:T[], seed:number):T[] {
  const shuffled = [...array];
  const random = createRandomGenerator(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}