const profileMap: Record<string, string> = {
  SCP_CCD: "Structured Collaborator",
  CCD_SCP: "Structured Collaborator",

  SCP_SPO: "Steady Executor",
  SPO_SCP: "Steady Executor",

  SCP_FIE: "Independent Problem Solver",
  FIE_SCP: "Independent Problem Solver",

  CCD_FIE: "Adaptive Team Contributor",
  FIE_CCD: "Adaptive Team Contributor",

  CCD_SPO: "Supportive Team Stabilizer",
  SPO_CCD: "Supportive Team Stabilizer",

  FIE_SPO: "Practical Adapter",
  SPO_FIE: "Practical Adapter",
};

export function getProfile(
  primary: string,
  secondary: string
): string {
  const key = `${primary}_${secondary}`;

  return (
    profileMap[key] ||
    "No Profile Found"
  );
}