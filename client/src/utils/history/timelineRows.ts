import { Army, ExitStyle, MapPath, MarchTiming, Unit } from "../../types";
import { everMembers } from "../marches/armies";
import { unitLabel } from "../units/blocks";
import { HistoryTime } from "./historyTime";

// The history timeline's rows: one per unit, grouped by army, each holding everything that
// happens to that unit. Later weeks add new kinds of item to a row (formation changes,
// volleys, rout) and new groups (things on the map itself), not new kinds of row.

// What the rows show:
//   everything - every unit, with everything that happens to it
//   marches    - only the units that march, with just their marches
//   battle     - battle events (clashes, volleys, rout); none until week 11.5
//   map        - things on the map itself (arrows, labels, borders); none until week 12
export type ShowFilter = "everything" | "marches" | "battle" | "map";

export const SHOW_FILTERS: ShowFilter[] = [
  "everything",
  "marches",
  "battle",
  "map",
];

// The filters with nothing to show yet, and the week that brings their things
export const COMING_LATER: Partial<Record<ShowFilter, string>> = {
  battle: "week 11.5",
  map: "week 12",
};

export const NO_ARMY = "no-army"; // the key of the group for units in no army

// A march with its dates, as the timeline shows them (a bar being dragged shows its draft)
export interface MarchRow {
  path: MapPath;
  timing: MarchTiming;
}

// Something that happens to a unit, drawn on its row
export type RowItem =
  | { kind: "arrives"; at: HistoryTime }
  | { kind: "march"; path: MapPath; timing: MarchTiming }
  | {
      kind: "loss";
      index: number; // which of the block's losses
      start: HistoryTime;
      end: HistoryTime;
      share: number;
    }
  | { kind: "leaves"; at: HistoryTime; style: ExitStyle | null };

export interface UnitRow {
  unit: Unit;
  label: string;
  items: RowItem[]; // earliest first
  // From the row's first item to its last; null when nothing on it is dated
  start: HistoryTime | null;
  end: HistoryTime | null;
}

export interface RowGroup {
  key: string; // the army's id, or NO_ARMY
  army: Army | null;
  rows: UnitRow[]; // the rows listed
  total: number; // how many units the group has, listed or not
  start: HistoryTime | null; // from the group's first item to its last
  end: HistoryTime | null;
}

// When an item starts and ends on the row
export function itemSpan(item: RowItem): [HistoryTime, HistoryTime] {
  switch (item.kind) {
    case "march":
      return [item.timing.start, item.timing.end];
    case "loss":
      return [item.start, item.end];
    default:
      return [item.at, item.at];
  }
}

// Everything that happens to a unit. It arrives (when that's after the story starts), goes
// on its marches, loses men (blocks), and leaves.
export function rowItems(
  unit: Unit,
  marches: MarchRow[],
  storyStart: HistoryTime
): RowItem[] {
  const items: RowItem[] = [];
  if (unit.appears !== undefined && unit.appears > storyStart)
    items.push({ kind: "arrives", at: unit.appears });
  for (const { path, timing } of marches)
    if (path.assignments.some((a) => a.unitId === unit.id))
      items.push({ kind: "march", path, timing });
  (unit.block?.losses ?? []).forEach((loss, index) =>
    items.push({ kind: "loss", index, ...loss })
  );
  if (unit.leaves !== undefined)
    items.push({
      kind: "leaves",
      at: unit.leaves,
      style: unit.exit?.style ?? null,
    });
  return items
    .map((item, order) => ({ item, order }))
    .sort(
      (a, b) => itemSpan(a.item)[0] - itemSpan(b.item)[0] || a.order - b.order
    )
    .map(({ item }) => item);
}

// The group a unit is listed under: the first army it is ever in. A unit that moves between
// armies stays in one place, so rows don't jump about as the playhead moves.
export function groupKeyOfUnit(unitId: string, armies: Army[]): string {
  return (
    armies.find((army) => everMembers(army).includes(unitId))?.id ?? NO_ARMY
  );
}

function rowOf(unit: Unit, items: RowItem[]): UnitRow {
  const spans = items.map(itemSpan);
  return {
    unit,
    label: unitLabel(unit),
    items,
    start: spans.length ? Math.min(...spans.map(([start]) => start)) : null,
    end: spans.length ? Math.max(...spans.map(([, end]) => end)) : null,
  };
}

// The timeline's rows: one group per army, in the order the armies were made, then the
// units in no army. Each group lists its units earliest first (units with nothing dated go
// last, in the order they were placed). The selected units are always listed. Groups with
// nothing to list are left out.
export function groupRows(
  units: Unit[],
  marches: MarchRow[],
  armies: Army[],
  filter: ShowFilter,
  storyStart: HistoryTime,
  selectedUnitIds: ReadonlySet<string>
): RowGroup[] {
  if (filter === "battle" || filter === "map") return [];

  const byKey = new Map<string, { row: UnitRow; index: number }[]>();
  const totals = new Map<string, number>();
  units.forEach((unit, index) => {
    const key = groupKeyOfUnit(unit.id, armies);
    totals.set(key, (totals.get(key) ?? 0) + 1);
    const all = rowItems(unit, marches, storyStart);
    const items =
      filter === "marches" ? all.filter((item) => item.kind === "march") : all;
    if (
      filter === "marches" &&
      items.length === 0 &&
      !selectedUnitIds.has(unit.id)
    )
      return;
    const list = byKey.get(key) ?? [];
    list.push({ row: rowOf(unit, items), index });
    byKey.set(key, list);
  });

  const order: { key: string; army: Army | null }[] = [
    ...armies.map((army) => ({ key: army.id, army })),
    { key: NO_ARMY, army: null },
  ];
  const groups: RowGroup[] = [];
  for (const { key, army } of order) {
    const listed = byKey.get(key);
    if (!listed || listed.length === 0) continue;
    const rows = listed
      .sort(
        (a, b) =>
          (a.row.start ?? Infinity) - (b.row.start ?? Infinity) ||
          a.index - b.index
      )
      .map(({ row }) => row);
    const starts = rows.flatMap((row) =>
      row.start === null ? [] : [row.start]
    );
    const ends = rows.flatMap((row) => (row.end === null ? [] : [row.end]));
    groups.push({
      key,
      army,
      rows,
      total: totals.get(key) ?? rows.length,
      start: starts.length ? Math.min(...starts) : null,
      end: ends.length ? Math.max(...ends) : null,
    });
  }
  return groups;
}
