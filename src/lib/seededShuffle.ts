/**
 * Creates a predictable pseudo-random number generator based on a seed.
 */
function createRandomGenerator(seed :number) :()=>number{
  let currentSeed = seed;
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