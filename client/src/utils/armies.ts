import { Army, ArmyMember, MapPath, PathAssignment, Unit } from "../types";
import { HistoryTime, MINUTE } from "./historyTime";
import { existsAt, validMarch } from "./timeline";

// Two moments closer than this count as the same moment
const SAME_MOMENT = MINUTE / 2;

// Moments are passed as `at`: a moment in history, or undefined for the story's start.
// Memberships store the same way: a missing `joins` means from the start.
const momentOf = (at: HistoryTime | undefined) => at ?? -Infinity;

const sameMoment = (a: HistoryTime | undefined, b: HistoryTime | undefined) =>
  a === undefined || b === undefined ? a === b : Math.abs(a - b) < SAME_MOMENT;

// Whether a membership is in force at a moment
export function memberAt(member: ArmyMember, t: HistoryTime): boolean {
  return (member.joins ?? -Infinity) <= t && t < (member.leaves ?? Infinity);
}

// The units in an army at a moment, in the order they joined the list
export function membersAt(army: Army, t: HistoryTime): string[] {
  const ids: string[] = [];
  for (const member of army.members) {
    if (memberAt(member, t) && !ids.includes(member.unitId))
      ids.push(member.unitId);
  }
  return ids;
}

// Every unit that is ever in an army
export function everMembers(army: Army): string[] {
  return Array.from(new Set(army.members.map((member) => member.unitId)));
}

// The army a unit is in at a moment, if any
export function armyOfUnitAt(
  armies: Army[],
  unitId: string,
  t: HistoryTime
): Army | undefined {
  return armies.find((army) =>
    army.members.some(
      (member) => member.unitId === unitId && memberAt(member, t)
    )
  );
}

export function nextArmyName(armies: Army[]): string {
  const used = armies
    .map((army) => /^Army (\d+)$/.exec(army.name))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => Number(match[1]));
  return `Army ${used.length > 0 ? Math.max(...used) + 1 : 1}`;
}

export const newArmyId = () =>
  `army-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Ends a membership at a moment. One that began at that same moment never really happened,
// so it is removed rather than left with no length.
function endAt(
  member: ArmyMember,
  at: HistoryTime | undefined
): ArmyMember | null {
  if (at === undefined || sameMoment(member.joins, at)) return null;
  return { ...member, leaves: at };
}

// Units leave an army at a moment (undefined: the story's start, so they were never in it then)
export function leaveArmy(
  armies: Army[],
  armyId: string,
  unitIds: string[],
  at: HistoryTime | undefined
): Army[] {
  const ids = new Set(unitIds);
  const t = momentOf(at);
  return armies.map((army) => {
    if (army.id !== armyId) return army;
    const members: ArmyMember[] = [];
    for (const member of army.members) {
      if (!ids.has(member.unitId) || !memberAt(member, t)) {
        members.push(member);
        continue;
      }
      const ended = endAt(member, at);
      if (ended) members.push(ended);
    }
    return { ...army, members };
  });
}

// Units join an army at a moment. A unit is in one army at a time, so any army it is in at
// that moment it leaves then. Units already in this army are left as they are.
export function joinArmy(
  armies: Army[],
  armyId: string,
  unitIds: string[],
  at: HistoryTime | undefined
): Army[] {
  const t = momentOf(at);
  let next = armies;
  for (const army of armies) {
    if (army.id === armyId) continue;
    const leaving = unitIds.filter((id) =>
      army.members.some((member) => member.unitId === id && memberAt(member, t))
    );
    if (leaving.length > 0) next = leaveArmy(next, army.id, leaving, at);
  }

  return next.map((army) => {
    if (army.id !== armyId) return army;
    const already = new Set(membersAt(army, t));
    const joining = unitIds
      .filter((id) => !already.has(id))
      .map(
        (unitId): ArmyMember =>
          at === undefined ? { unitId } : { unitId, joins: at }
      );
    return joining.length > 0
      ? { ...army, members: [...army.members, ...joining] }
      : army;
  });
}

// Forgets units entirely (they were deleted from the project)
export function forgetUnits(
  armies: Army[],
  unitIds: ReadonlySet<string>
): Army[] {
  if (unitIds.size === 0) return armies;
  return armies.map((army) =>
    army.members.some((member) => unitIds.has(member.unitId))
      ? {
          ...army,
          members: army.members.filter((member) => !unitIds.has(member.unitId)),
        }
      : army
  );
}

// The army a march for these units belongs to when they are attached to a path at a moment:
// - all of them are in the same army then: that army
// - none of them is in any army: a new army of just them, named automatically
// - a mix: no army (it stays a plain march)
export function armyForAttach(
  armies: Army[],
  unitIds: string[],
  at: HistoryTime | undefined
): { armies: Army[]; armyId: string | undefined } {
  const t = momentOf(at);
  const owners = unitIds.map((id) => armyOfUnitAt(armies, id, t)?.id);

  if (
    owners.length > 0 &&
    owners[0] !== undefined &&
    owners.every((id) => id === owners[0])
  ) {
    return { armies, armyId: owners[0] };
  }
  if (owners.length > 0 && owners.every((id) => id === undefined)) {
    const army: Army = {
      id: newArmyId(),
      name: nextArmyName(armies),
      members: unitIds.map((unitId) =>
        at === undefined ? { unitId } : { unitId, joins: at }
      ),
    };
    return { armies: [...armies, army], armyId: army.id };
  }
  return { armies, armyId: undefined };
}

// Memberships that reproduce exactly who was on each of an army's dated marches. Membership
// only matters when a march sets off, so a unit is a member from the start of the first march
// it is on until the start of the next march of the army that it isn't on. Marches that set
// off together count as one. Units only on undated marches are members from the start.
function membershipsFromMarches(
  armyId: string,
  paths: MapPath[],
  storyStart: HistoryTime
): ArmyMember[] {
  const own = paths.filter(
    (p) => p.armyId === armyId && p.assignments.length > 0
  );
  const dated = own
    .map((path) => ({ path, march: validMarch(path.march) }))
    .filter(
      (
        m
      ): m is {
        path: MapPath;
        march: NonNullable<ReturnType<typeof validMarch>>;
      } => m.march !== undefined
    )
    .sort((a, b) => a.march.start - b.march.start);

  // Marches that set off at the same moment, as one group each
  const groups: { start: HistoryTime; unitIds: Set<string> }[] = [];
  for (const { path, march } of dated) {
    const last = groups[groups.length - 1];
    const ids = path.assignments.map((a) => a.unitId);
    if (last && Math.abs(last.start - march.start) < SAME_MOMENT) {
      ids.forEach((id) => last.unitIds.add(id));
    } else {
      groups.push({ start: march.start, unitIds: new Set(ids) });
    }
  }

  const order: string[] = [];
  for (const path of own) {
    for (const { unitId } of path.assignments)
      if (!order.includes(unitId)) order.push(unitId);
  }

  const members: ArmyMember[] = [];
  for (const unitId of order) {
    let open: ArmyMember | null = null;
    let onAny = false;
    for (const group of groups) {
      if (group.unitIds.has(unitId)) {
        onAny = true;
        if (!open) {
          open = { unitId };
          if (group.start > storyStart) open.joins = group.start;
        }
      } else if (open) {
        members.push({ ...open, leaves: group.start });
        open = null;
      }
    }
    if (open) members.push(open);
    if (!onAny) members.push({ unitId }); // only on undated marches
  }
  return members;
}

// Rebuilds each army's memberships from its marches, so that every march keeps exactly the
// units it had. Units in an army that are on none of its marches keep their memberships.
export function rebuildMemberships(
  armies: Army[],
  paths: MapPath[],
  storyStart: HistoryTime
): Army[] {
  return armies.map((army) => {
    const derived = membershipsFromMarches(army.id, paths, storyStart);
    if (derived.length === 0) return army;
    const onMarches = new Set(derived.map((m) => m.unitId));
    const others = army.members.filter((m) => !onMarches.has(m.unitId));
    return { ...army, members: [...derived, ...others] };
  });
}

// Armies for a project that has none yet: units that share marches become one army, named
// Army 1, Army 2... in the order their first march appears, and those marches belong to it.
// Memberships are dated so that every march keeps exactly the units it had.
export function deriveArmies(
  paths: MapPath[],
  storyStart: HistoryTime
): { armies: Army[]; paths: MapPath[] } {
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(id, root);
    return root;
  };
  const union = (a: string, b: string) => parent.set(find(a), find(b));

  for (const path of paths) {
    const ids = path.assignments.map((a) => a.unitId);
    ids.forEach((id) => {
      if (!parent.has(id)) parent.set(id, id);
    });
    for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
  }

  const armyByRoot = new Map<string, Army>();
  const armies: Army[] = [];
  const nextPaths = paths.map((path) => {
    if (path.assignments.length === 0) return path;
    const root = find(path.assignments[0].unitId);
    let army = armyByRoot.get(root);
    if (!army) {
      army = {
        id: `army-${armies.length + 1}-${root}`,
        name: `Army ${armies.length + 1}`,
        members: [],
      };
      armyByRoot.set(root, army);
      armies.push(army);
    }
    return { ...path, armyId: army.id };
  });

  return {
    armies: rebuildMemberships(armies, nextPaths, storyStart),
    paths: nextPaths,
  };
}

const sameUnits = (a: PathAssignment[], ids: string[]) =>
  a.length === ids.length &&
  ids.every((id) => a.some((slot) => slot.unitId === id));

// Keeps every army march made up of whoever is in its army, and on the map, when it sets off.
// Units that stay keep their places; units that join get a place that the timeline measures
// from where they stand when the march begins. Returns the same array when nothing changed.
export function syncArmyMarches(
  paths: MapPath[],
  armies: Army[],
  units: Unit[]
): MapPath[] {
  if (armies.length === 0) return paths;
  const armyById = new Map(
    armies.map((army): [string, Army] => [army.id, army])
  );
  const unitById = new Map(
    units.map((unit): [string, Unit] => [unit.id, unit])
  );

  let changed = false;
  const next = paths.map((path) => {
    const army = path.armyId ? armyById.get(path.armyId) : undefined;
    const march = validMarch(path.march);
    if (!army || !march) return path;

    const ids = membersAt(army, march.start).filter((id) => {
      const unit = unitById.get(id);
      return unit !== undefined && existsAt(unit, march.start);
    });
    if (sameUnits(path.assignments, ids)) return path;

    changed = true;
    return {
      ...path,
      assignments: ids.map(
        (unitId) =>
          path.assignments.find((slot) => slot.unitId === unitId) ?? {
            unitId,
            forward: 0,
            right: 0,
          }
      ),
    };
  });
  return changed ? next : paths;
}
