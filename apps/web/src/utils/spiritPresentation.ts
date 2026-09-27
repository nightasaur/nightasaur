export const STAGES = ['EGG', 'HATCHLING', 'JUVENILE', 'ADULT', 'ULTIMATE', 'LEGENDARY'] as const;
export const REQ: Record<string, number> = {EGG: 1, HATCHLING: 1, JUVENILE: 5, ADULT: 15, ULTIMATE: 30, LEGENDARY: 60};
export function progression(stage: string, level: number) {
  const index = STAGES.indexOf(stage as typeof STAGES[number]);
  const valid = index >= 0 && Number.isInteger(level) && level >= 1;
  const next = valid ? STAGES[index + 1] : undefined;
  return { index, next, required: next ? REQ[next] : null, canEvolve: Boolean(next && level >= REQ[next]), valid };
}
// Cosmetic growth indicators, not persisted battle statistics.
export function growthValue(stage: string, level: number, multiplier: number, base: number): number | null {
  const p = progression(stage, level);
  return p.valid ? level * multiplier + p.index * base : null;
}
