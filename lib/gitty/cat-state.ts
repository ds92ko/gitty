export const CAT_STATES = [
  "normal",
  "happy",
  "excited",
  "love",
  "proud",
  "confused",
  "surprised",
  "crying",
  "angry",
  "tired",
  "sleeping",
  "waiting",
  "coding",
  "coffee",
  "idea",
  "celebrating",
  "peeking",
  "burned_out",
  "nervous",
  "cheering",
] as const;

export type CatState = (typeof CAT_STATES)[number];

export function getCatStateImagePath(state: CatState) {
  return `/cats/${state}.png` as const;
}

export function isCatState(value: unknown): value is CatState {
  return (
    typeof value === "string" && CAT_STATES.includes(value as CatState)
  );
}
