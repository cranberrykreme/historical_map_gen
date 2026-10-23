import React, { useEffect, useRef, useState } from "react";
import UnitCard from "./UnitCard";
import MarchCard from "./MarchCard";
import ShotCard from "./ShotCard";
import TerrainCard from "./TerrainCard";
import { useMapStore } from "../../store/useMapStore";
import { useTerrainToolStore } from "../../store/useTerrainToolStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { activeBattle } from "../../utils/scenes/kinds";
import { unitLabel } from "../../utils/units/blocks";
import { featureLabels } from "../../utils/terrain/terrain";
import {
  CardFocus,
  nextFocus,
  SelectionState,
} from "../../utils/project/selectionFocus";
import {
  CARD_LEFT,
  CardPosition,
  cardMaxHeight,
  clampCardPosition,
  defaultCardTop,
} from "../../utils/project/cardPlacement";
import styles from "./SelectionCard.module.css";

const KIND_WORD: Record<CardFocus, string> = {
  units: "Unit",
  march: "March",
  shot: "Shot",
  terrain: "Terrain",
};

const NOTHING: SelectionState = {
  unitIds: new Set(),
  pathId: null,
  shotId: null,
  terrainId: null,
};

// What is selected right now, in both stores
function readSelection(): SelectionState {
  const map = useMapStore.getState();
  return {
    unitIds: map.selectedUnitIds,
    pathId: map.selectedPathId,
    shotId: map.selectedShotId,
    terrainId: useTerrainToolStore.getState().selectedId,
  };
}

// Keeps track of which selected thing the card shows: whatever was selected last
function useCardFocus(): CardFocus | null {
  const [focus, setFocus] = useState<CardFocus | null>(null);
  // Starts from nothing selected, so whatever is already selected shows straight away
  const last = useRef<SelectionState>(NOTHING);

  useEffect(() => {
    const update = () => {
      const next = readSelection();
      const prev = last.current;
      if (
        next.unitIds === prev.unitIds &&
        next.pathId === prev.pathId &&
        next.shotId === prev.shotId &&
        next.terrainId === prev.terrainId
      )
        return;
      last.current = next;
      setFocus((focus) => nextFocus(focus, prev, next));
    };
    update();
    const offMap = useMapStore.subscribe(update);
    const offTerrain = useTerrainToolStore.subscribe(update);
    return () => {
      offMap();
      offTerrain();
    };
  }, []);

  return focus;
}

// Where the card has been dragged to (null until it's moved). It stays put for the session
// as different things are selected; double-clicking the header puts it back.
function useCardDrag() {
  const [moved, setMoved] = useState<CardPosition | null>(null);

  const startDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    const card = e.currentTarget.closest("aside");
    if (!card) return;
    e.preventDefault();
    const box = card.getBoundingClientRect();
    const grab = { x: e.clientX - box.left, y: e.clientY - box.top };
    const move = (event: PointerEvent) =>
      setMoved(
        clampCardPosition(
          { x: event.clientX - grab.x, y: event.clientY - grab.y },
          window.innerWidth,
          window.innerHeight
        )
      );
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  return { moved, startDrag, putBack: () => setMoved(null) };
}

// One card (at the map's left edge until it's dragged) with every setting of the thing in hand: the selected
// units, march, shot or terrain feature. The tabs keep the lists of everything; this is for
// the one thing selected. Deselecting (or ×) hides it.
function SelectionCard() {
  const focus = useCardFocus();
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const paths = useMapStore((state) => state.paths);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const shots = useMapStore((state) => state.shots);
  const selectedShotId = useMapStore((state) => state.selectedShotId);
  const battle = useMapStore(activeBattle);
  const terrainId = useTerrainToolStore((state) => state.selectedId);
  const timelineTop = useTimelineStore((state) => state.timelineTop);
  const hintBottom = useTerrainToolStore((state) => state.hintBottom);
  const { moved, startDrag, putBack } = useCardDrag();

  const units = placedUnits.filter((unit) => selectedUnitIds.has(unit.id));
  const path = paths.find((p) => p.id === selectedPathId);
  const shot = shots.find((s) => s.id === selectedShotId);
  const feature = battle?.terrain?.find((f) => f.id === terrainId);

  let title = "";
  let body: React.ReactNode = null;
  if (focus === "units" && units.length > 0) {
    title = units.length === 1 ? unitLabel(units[0]) : `${units.length} units`;
    body = <UnitCard units={units} />;
  } else if (focus === "march" && path) {
    title = path.name;
    body = <MarchCard key={path.id} path={path} />;
  } else if (focus === "shot" && shot) {
    title = shot.name;
    body = <ShotCard key={shot.id} shot={shot} />;
  } else if (focus === "terrain" && battle && feature) {
    title = featureLabels(battle.terrain ?? []).get(feature.id) ?? "";
    body = <TerrainCard key={feature.id} battle={battle} feature={feature} />;
  }
  if (!focus || !body) return null;

  // Hides the card by deselecting what it shows
  const close = () => {
    const map = useMapStore.getState();
    if (focus === "units") map.selectUnit(null);
    if (focus === "march") map.selectPath(null);
    if (focus === "shot") map.selectShot(null);
    if (focus === "terrain") useTerrainToolStore.getState().select(null);
  };

  const left = moved?.x ?? CARD_LEFT;
  const top = moved?.y ?? defaultCardTop(hintBottom);
  const maxHeight = cardMaxHeight(top, timelineTop, window.innerHeight);

  return (
    <aside
      className={styles.card}
      style={{ left, top, maxHeight }}
      aria-label={`${KIND_WORD[focus]}: ${title}`}
      // Keys typed in the card's boxes belong to them, not to the map's shortcuts
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).closest("input, select, textarea"))
          e.stopPropagation();
      }}
    >
      <header
        className={styles.header}
        title="Drag to move the card · double-click to put it back"
        onPointerDown={startDrag}
        onDoubleClick={(e) => {
          if (!(e.target as HTMLElement).closest("button")) putBack();
        }}
      >
        <span className={styles.kind}>{KIND_WORD[focus]}</span>
        <span className={styles.title} title={title}>
          {title}
        </span>
        <button
          className={styles.close}
          onClick={close}
          title="Deselect (the card closes)"
        >
          ×
        </button>
      </header>
      <div className={styles.body}>{body}</div>
    </aside>
  );
}

export default SelectionCard;
