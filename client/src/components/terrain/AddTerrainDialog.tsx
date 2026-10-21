import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TerrainKind, TerrainStyle } from "../../types";
import {
  TERRAIN_GROUPS,
  TERRAIN_KINDS,
  TerrainShape,
} from "../../utils/terrain/terrain";
import TerrainPatterns from "./TerrainPatterns";
import TerrainThumb from "./TerrainThumb";
import styles from "./AddTerrainDialog.module.css";

// Other words people search by
const ALSO: Partial<Record<TerrainKind, string>> = {
  deep: "sea ocean",
  shallows: "sea coast",
  lake: "pond water loch",
  reef: "rocks sea",
  land: "island coast",
  sand: "beach desert dunes",
  field: "farm crops grass",
  scrub: "bushes heath",
  marsh: "swamp bog fen wetland",
  snow: "ice winter",
  rocks: "stones boulders",
  hill: "high ground slope",
  mountain: "peaks high ground",
  forest: "trees woods",
  pines: "trees woods conifer",
  orchard: "trees fruit",
  town: "village city houses buildings",
  river: "water",
  stream: "water brook creek",
  ditch: "trench moat dyke",
  road: "track path street",
  bridge: "crossing",
  ridge: "hill high ground",
  cliff: "rocks drop",
  wall: "fortification stone",
  palisade: "fence stockade fort wood",
};

// Every kind of terrain as a big picture with its name and what it's for, grouped, with a
// search box. Picking one starts drawing it, or (when changing a feature) turns the feature
// into it, in which case only kinds of the same shape (areas or lines) are offered.
function AddTerrainDialog({
  title,
  shape,
  current,
  onPick,
  onClose,
  style,
}: {
  title: string;
  style?: TerrainStyle; // the battle's style, which the pictures are drawn in
  shape?: TerrainShape; // only offer areas, or only lines
  current?: TerrainKind; // the kind it is now, outlined
  onPick: (kind: TerrainKind) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  // Esc closes it, before anything else on the page sees the key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const words = search.trim().toLowerCase();
  const offered = TERRAIN_KINDS.filter(
    (k) =>
      (!shape || k.shape === shape) &&
      (!words ||
        words.split(/\s+/).every((word) => {
          // a word in the description that starts with what's typed
          const text = ` ${k.label} ${k.group} ${k.hint} ${ALSO[k.kind] ?? ""}`
            .toLowerCase()
            .replace(/[^a-z]+/g, " ");
          return text.includes(` ${word.replace(/[^a-z]/g, "")}`);
        }))
  );

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <TerrainPatterns style={style} />
      <div className={styles.panel} role="dialog" aria-label={title}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <input
            autoFocus
            className={styles.search}
            placeholder="Search: river, trees, wall…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              // Enter picks the only match
              if (e.key === "Enter" && offered.length === 1)
                onPick(offered[0].kind);
            }}
          />
          <button
            className={styles.close}
            onClick={onClose}
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
        <div className={styles.body}>
          {offered.length === 0 && (
            <p className={styles.empty}>Nothing matches “{search}”.</p>
          )}
          {TERRAIN_GROUPS.map((group) => {
            const kinds = offered.filter((k) => k.group === group);
            if (kinds.length === 0) return null;
            return (
              <React.Fragment key={group}>
                <p className={styles.group}>{group}</p>
                <div className={styles.grid}>
                  {kinds.map(({ kind, label, hint, shape: kindShape }) => (
                    <button
                      key={kind}
                      className={`${styles.tile} ${kind === current ? styles.current : ""}`}
                      title={
                        kindShape === "line"
                          ? "Click points along it on the map, double-click to finish"
                          : "Click points round its edge on the map, double-click to finish"
                      }
                      onClick={() => onPick(kind)}
                    >
                      <TerrainThumb kind={kind} height={86} style={style} />
                      <span className={styles.name}>{label}</span>
                      <span className={styles.hint}>{hint}</span>
                    </button>
                  ))}
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <p className={styles.footer}>
          Terrain blends where it meets: rivers fan out into the sea and narrow
          to their source, roads get bridges and fords, roads and rivers cut
          lanes through woods, coasts get surf and beaches, and overlapping
          shapes of one kind merge.
        </p>
      </div>
    </div>,
    document.body
  );
}

export default AddTerrainDialog;
