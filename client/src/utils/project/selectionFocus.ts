// Which selected thing the selection card shows. Units, a march, a shot and a terrain feature
// can each be selected at once (units stay selected while you click the march to attach them
// to), so the card follows whatever was selected last. When that is deselected it falls back
// to whatever else is still selected.

export type CardFocus = "units" | "march" | "shot" | "terrain";

export interface SelectionState {
  unitIds: ReadonlySet<string>;
  pathId: string | null;
  shotId: string | null;
  terrainId: string | null;
}

// Which kinds have something selected
function selectedKinds(s: SelectionState): Set<CardFocus> {
  const kinds = new Set<CardFocus>();
  if (s.unitIds.size > 0) kinds.add("units");
  if (s.pathId !== null) kinds.add("march");
  if (s.shotId !== null) kinds.add("shot");
  if (s.terrainId !== null) kinds.add("terrain");
  return kinds;
}

// Whether the selection of this kind changed to something new (not just cleared)
function newlySelected(
  kind: CardFocus,
  prev: SelectionState,
  next: SelectionState
): boolean {
  switch (kind) {
    case "units":
      return (
        next.unitIds.size > 0 &&
        (next.unitIds.size !== prev.unitIds.size ||
          Array.from(next.unitIds).some((id) => !prev.unitIds.has(id)))
      );
    case "march":
      return next.pathId !== null && next.pathId !== prev.pathId;
    case "shot":
      return next.shotId !== null && next.shotId !== prev.shotId;
    case "terrain":
      return next.terrainId !== null && next.terrainId !== prev.terrainId;
  }
}

// When nothing new was picked, the order to fall back in
const FALLBACK: CardFocus[] = ["shot", "march", "terrain", "units"];

export function nextFocus(
  focus: CardFocus | null,
  prev: SelectionState,
  next: SelectionState
): CardFocus | null {
  const picked = FALLBACK.filter((kind) => newlySelected(kind, prev, next));
  // Something new was selected: show it. If several changed together, the one with the
  // most specific settings wins (a shot over a march over units).
  if (picked.length > 0) return picked[0];
  const still = selectedKinds(next);
  if (focus !== null && still.has(focus)) return focus;
  return FALLBACK.find((kind) => still.has(kind)) ?? null;
}

// The value every item shares, or undefined when they differ (or there are none). Several
// selected units only show the settings they have in common.
export function sharedValue<T, V>(
  items: readonly T[],
  read: (item: T) => V
): V | undefined {
  if (items.length === 0) return undefined;
  const first = read(items[0]);
  const key = JSON.stringify(first ?? null);
  return items.every((item) => JSON.stringify(read(item) ?? null) === key)
    ? first
    : undefined;
}
