// Pure money calculators shared by the UI and the agent's tools.

export function loanCost(principal: number, totalRepay: number, weeks: number) {
  const extra = Math.max(0, totalRepay - principal);
  const per100 = principal > 0 ? Math.round((extra / principal) * 100) : 0;
  const years = Math.max(weeks, 1) / 52;
  const yearlyPct = principal > 0 ? Math.round((extra / principal / years) * 100) : 0;
  const rating: "very_expensive" | "costly" | "fair" = yearlyPct > 50 ? "very_expensive" : yearlyPct > 24 ? "costly" : "fair";
  return { extra, per100, yearlyPct, rating };
}

const r10 = (n: number) => Math.round(n / 10) * 10;

/** ₹650 → savings 50 · home 450 · fuel 120 · goal 30 (matches the Figma example). */
export function splitEarning(amount: number) {
  const savings = Math.max(10, r10(amount * 0.08));
  const fuel = r10(amount * 0.18);
  const goal = r10(amount * 0.05);
  const home = Math.max(0, amount - savings - fuel - goal);
  return { savings, home, fuel, goal };
}
