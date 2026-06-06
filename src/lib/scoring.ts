export interface Scores {
  SCP: number;
  FIE: number;
  CCD: number;
  SPO: number;
}

export function calculateScores(
  answers: Record<string, string>
): Scores {
  const scores: Scores = {
    SCP: 0,
    FIE: 0,
    CCD: 0,
    SPO: 0,
  };

  Object.values(answers).forEach((answer) => {
    switch (answer) {
      case "A":
        scores.SCP++;
        break;

      case "B":
        scores.FIE++;
        break;

      case "C":
        scores.CCD++;
        break;

      case "D":
        scores.SPO++;
        break;
    }
  });

  return scores;
}