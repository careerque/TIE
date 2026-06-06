import { Scores } from "./scoring";

export interface PatternResult {
  primary: string;
  secondary: string;
}

export function getPatterns(
  scores: Scores
): PatternResult {
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);

  return {
    primary: sorted[0][0],
    secondary: sorted[1][0],
  };
}