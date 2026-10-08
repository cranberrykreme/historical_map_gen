import { Army, MapPath, MarchTiming } from "../types";
import { HistoryTime } from "./historyTime";
import { HistoryView } from "./timeline";

// Which marches the timeline lists:
//   all  - every march
//   now  - only marches under way at the playhead
//   view - marches that overlap the stretch of history on show
export type RowFilter = "all" | "now" | "view";

export const ROW_FILTERS: RowFilter[] = ["all", "now", "view"];

export const NO_ARMY = "no-army"; // the key of the group for marches that belong to no army

export interface MarchRow {
  path: MapPath;
  timing: MarchTiming;
}

export interface RowGroup {
  key: string; // the army's id, or NO_ARMY
  army: Army | null;
  rows: MarchRow[]; // the marches listed, earliest first
  total: number; // how many marches the group has, listed or not
  start: HistoryTime; // from the group's first march setting off...
  end: HistoryTime; // ...to its last one arriving
}

// A march is under way from the moment it sets off until it arrives
export const underWay = (timing: MarchTiming, moment: HistoryTime): boolean =>
  timing.start <= moment && moment <= timing.end;

// Any part of the march falls in the stretch of history on show
export const overlapsView = (timing: MarchTiming, view: HistoryView): boolean =>
  timing.end >= view.from && timing.start <= view.to;

export function rowPasses(
  timing: MarchTiming,
  filter: RowFilter,
  moment: HistoryTime,
  view: HistoryView
): boolean {
  if (filter === "now") return underWay(timing, moment);
  if (filter === "view") return overlapsView(timing, view);
  return true;
}

// The group a march is listed under
export const groupKeyOf = (path: MapPath, armies: Army[]): string =>
  path.armyId && armies.some((army) => army.id === path.armyId)
    ? path.armyId
    : NO_ARMY;

// The timeline's rows: one group per army, in the order the armies were made, then the
// marches that belong to no army. Each group lists its marches earliest first, keeping
// those the filter lets through. The selected march is always listed. Groups with nothing
// to list are left out.
export function groupRows(
  rows: MarchRow[],
  armies: Army[],
  filter: RowFilter,
  moment: HistoryTime,
  view: HistoryView,
  selectedPathId: string | null
): RowGroup[] {
  const byKey = new Map<string, MarchRow[]>();
  for (const row of rows) {
    const key = groupKeyOf(row.path, armies);
    const list = byKey.get(key);
    if (list) list.push(row);
    else byKey.set(key, [row]);
  }

  const order: { key: string; army: Army | null }[] = [
    ...armies.map((army) => ({ key: army.id, army })),
    { key: NO_ARMY, army: null },
  ];

  const groups: RowGroup[] = [];
  for (const { key, army } of order) {
    const all = byKey.get(key);
    if (!all || all.length === 0) continue;
    // Earliest first; marches that set off together keep the order they were drawn in
    const sorted = all
      .map((row, index) => ({ row, index }))
      .sort(
        (a, b) => a.row.timing.start - b.row.timing.start || a.index - b.index
      )
      .map(({ row }) => row);
    const listed = sorted.filter(
      (row) =>
        row.path.id === selectedPathId ||
        rowPasses(row.timing, filter, moment, view)
    );
    if (listed.length === 0) continue;
    groups.push({
      key,
      army,
      rows: listed,
      total: sorted.length,
      start: Math.min(...sorted.map((row) => row.timing.start)),
      end: Math.max(...sorted.map((row) => row.timing.end)),
    });
  }
  return groups;
}
