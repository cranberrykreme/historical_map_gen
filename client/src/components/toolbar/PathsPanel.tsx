import React, { useEffect, useState } from "react";
import ToolbarButton from "./ToolbarButton";
import { useMapStore } from "../../store/useMapStore";
import { useAssetStore } from "../../store/useAssetStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { getTimeline } from "../../utils/timeline";
import { unitFacing } from "../../utils/unitFacing";
import { TravelMode, Unit } from "../../types";
import API_BASE_URL from "../../config/api";
import deleteStyles from "./DeleteButton.module.css";
import styles from "./PathsPanel.module.css";
import { useTimelineStore } from "../../store/useTimelineStore";
import { formatHistoryTime } from "../../utils/historyTime";

const PLAY_SPEED = 100; // map units per second at 1x
const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

const TRAVEL_MODES: { mode: TravelMode; label: string; hint: string }[] = [
  {
    mode: "rotate",
    label: "Turn",
    hint: "Turns to face the direction of travel",
  },
  {
    mode: "upright",
    label: "Upright",
    hint: "Never turns; flips left or right so it is never upside down",
  },
  { mode: "fixed", label: "Fixed", hint: "Never turns or flips" },
];

// The lifespan rows (inline so PathsPanel.module.css doesn't change)
const LIFESPAN: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  margin: "6px 0",
};
const LIFESPAN_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: "var(--font-size-sm)",
};
const LIFESPAN_LABEL: React.CSSProperties = {
  width: 56,
  flexShrink: 0,
  color: "var(--color-text-dim)",
};
const LIFESPAN_VALUE: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  color: "var(--color-text-secondary)",
};
const SMALL_BUTTON: React.CSSProperties = {
  width: "auto",
  padding: "1px 6px",
  flexShrink: 0,
};

const displayName = (unit: Unit) => unit.filename.replace(/\.[^/.]+$/, "");

const FORMATION_MODES: {
  mode: "keep" | "wheel";
  label: string;
  hint: string;
}[] = [
  {
    mode: "keep",
    label: "Keep as placed",
    hint: "Units turn on the spot to face the path; the formation stays exactly as you laid it out",
  },
  {
    mode: "wheel",
    label: "Turn with units",
    hint: "The whole group turns with its units, so a row facing north ends up a row facing the way the path leaves",
  },
];

// Its own component, so the panel doesn't re-render on every frame of playback
function PlaybackSlider({
  pathId,
  onScrub,
}: {
  pathId: string;
  onScrub: () => void;
}) {
  const progress = usePathToolStore((state) =>
    state.preview && state.preview.pathId === pathId
      ? state.preview.progress
      : 0
  );
  const setPreview = usePathToolStore((state) => state.setPreview);
  return (
    <input
      type="range"
      min={0}
      max={1000}
      step={1}
      value={Math.round(progress * 1000)}
      onChange={(e) => {
        onScrub();
        setPreview(pathId, Number(e.target.value) / 1000);
      }}
      onPointerUp={(e) => e.currentTarget.blur()}
      className={styles.slider}
    />
  );
}

function PathsPanel() {
  const paths = useMapStore((state) => state.paths);
  const selectedPathId = useMapStore((state) => state.selectedPathId);
  const selectPath = useMapStore((state) => state.selectPath);
  const deletePath = useMapStore((state) => state.deletePath);
  const renamePath = useMapStore((state) => state.renamePath);
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const detachUnitFromPath = useMapStore((state) => state.detachUnitFromPath);
  const refreshPathFormation = useMapStore(
    (state) => state.refreshPathFormation
  );
  const setUnitsTravelMode = useMapStore((state) => state.setUnitsTravelMode);
  const setFormationMode = useMapStore((state) => state.setFormationMode);
  const bringBackUnits = useMapStore((state) => state.bringBackUnits);

  const currentProjectName = useAssetStore((state) => state.currentProjectName);
  const drawingPoints = usePathToolStore((state) => state.drawingPoints);
  const startDrawing = usePathToolStore((state) => state.startDrawing);
  const finishDrawing = usePathToolStore((state) => state.finishDrawing);
  const cancelDrawing = usePathToolStore((state) => state.cancelDrawing);
  const clearPreview = usePathToolStore((state) => state.clearPreview);
  const playbackSpeed = usePathToolStore((state) => state.playbackSpeed);
  const setPlaybackSpeed = usePathToolStore((state) => state.setPlaybackSpeed);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const isDrawing = drawingPoints !== null;
  const pointCount = drawingPoints?.length ?? 0;

  const selectedUnits = placedUnits.filter((unit) =>
    selectedUnitIds.has(unit.id)
  );
  const modes = new Set(
    selectedUnits.map((unit) => unitFacing(unit).travelMode)
  );
  const activeMode = modes.size === 1 ? Array.from(modes)[0] : null;

  // When the selected units exist in history
  const soleUnit = selectedUnits.length === 1 ? selectedUnits[0] : null;
  const leavingUnits = selectedUnits.filter(
    (unit) => unit.leaves !== undefined
  );
  const goTo = (moment: number) => {
    usePathToolStore.getState().clearPreview();
    setIsPlaying(false);
    const timeline = useTimelineStore.getState();
    timeline.pause();
    timeline.setNow(moment);
  };

  const selectedPath = paths.find((path) => path.id === selectedPathId);
  const attachedUnits = selectedPath
    ? selectedPath.assignments
        .map((a) => placedUnits.find((unit) => unit.id === a.unitId))
        .filter((unit): unit is Unit => unit !== undefined)
    : [];

  const formationMode =
    selectedPath && selectedPath.direction !== undefined ? "wheel" : "keep";

  // Switching paths, or leaving this panel, ends the preview: units go back to where they
  // really are. (A preview never changes the project.)
  useEffect(() => {
    setIsPlaying(false);
    return () => usePathToolStore.getState().clearPreview();
  }, [selectedPathId]);

  // Play: advance the preview at a steady speed until the end of the path.
  // Changing the speed restarts this from wherever the preview has got to.
  useEffect(() => {
    if (!isPlaying || !selectedPathId) return;
    const { paths: allPaths, placedUnits: allUnits } = useMapStore.getState();
    const path = allPaths.find((p) => p.id === selectedPathId);
    // The whole run: the pivot on the spot at the start, then the journey along the path
    const length =
      getTimeline(allPaths, allUnits).playbacks.get(selectedPathId)?.length ??
      0;
    if (!path || length === 0) {
      setIsPlaying(false);
      return;
    }

    const current = usePathToolStore.getState().preview;
    let position =
      current && current.pathId === selectedPathId && current.progress < 1
        ? current.progress
        : 0;
    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      // Cap the step so a background tab resuming doesn't make the units leap
      const elapsed = Math.min(Math.max((now - last) / 1000, 0), 0.1);
      last = now;
      position = Math.min(
        position + (elapsed * PLAY_SPEED * playbackSpeed) / length,
        1
      );
      usePathToolStore.getState().setPreview(selectedPathId, position);
      if (position >= 1) {
        setIsPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, selectedPathId, playbackSpeed]);

  const startRename = (id: string, currentName: string) => {
    setRenameValue(currentName);
    setRenamingId(id);
  };

  const commitRename = () => {
    if (renamingId === null) return;
    const id = renamingId;
    const current = paths.find((path) => path.id === id);
    const trimmed = renameValue.trim();
    setRenamingId(null);
    if (trimmed && current && trimmed !== current.name) {
      renamePath(id, trimmed);
    }
  };

  return (
    <div className={styles.panel}>
      <ToolbarButton
        icon="+"
        label="New path"
        isExpanded={true}
        isActive={isDrawing}
        onClick={() => {
          if (!isDrawing) startDrawing();
        }}
      />

      {isDrawing ? (
        <div className={styles.drawing}>
          <p className={styles.hint}>
            Move to the map and click to place waypoints. {pointCount} placed so
            far.
          </p>
          <div className={styles.actions}>
            <button
              className={styles.finishButton}
              onClick={finishDrawing}
              disabled={pointCount < 2}
            >
              Finish
            </button>
            <button className={styles.cancelButton} onClick={cancelDrawing}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {selectedUnits.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionTitle}>
                {selectedUnits.length} unit
                {selectedUnits.length === 1 ? "" : "s"} selected
              </p>
              <div className={styles.segment}>
                {TRAVEL_MODES.map(({ mode, label, hint }) => (
                  <button
                    key={mode}
                    title={hint}
                    className={`${styles.segmentButton} ${
                      activeMode === mode ? styles.segmentActive : ""
                    }`}
                    onClick={() =>
                      setUnitsTravelMode(
                        selectedUnits.map((unit) => unit.id),
                        mode
                      )
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className={styles.hint}>
                {activeMode
                  ? TRAVEL_MODES.find((m) => m.mode === activeMode)?.hint
                  : "Mixed settings"}
                . Click a path on the map to attach the selected units to it.
              </p>

              {soleUnit && (
                <div style={LIFESPAN}>
                  <div style={LIFESPAN_ROW}>
                    <span style={LIFESPAN_LABEL}>Appears</span>
                    <span style={LIFESPAN_VALUE}>
                      {soleUnit.appears !== undefined
                        ? formatHistoryTime(soleUnit.appears, "times")
                        : "From the start"}
                    </span>
                    {soleUnit.appears !== undefined && (
                      <button
                        className={styles.cancelButton}
                        style={SMALL_BUTTON}
                        title="Move the playhead to when this unit appears, where it can be moved and turned"
                        onClick={() => goTo(soleUnit.appears!)}
                      >
                        Go there
                      </button>
                    )}
                  </div>
                  <div style={LIFESPAN_ROW}>
                    <span style={LIFESPAN_LABEL}>Leaves</span>
                    <span style={LIFESPAN_VALUE}>
                      {soleUnit.leaves !== undefined
                        ? formatHistoryTime(soleUnit.leaves, "times")
                        : "Never"}
                    </span>
                    {soleUnit.leaves !== undefined && (
                      <button
                        className={styles.cancelButton}
                        style={SMALL_BUTTON}
                        title="Keep this unit until the end of the story"
                        onClick={() => bringBackUnits([soleUnit.id])}
                      >
                        Bring back
                      </button>
                    )}
                  </div>
                </div>
              )}
              {!soleUnit && leavingUnits.length > 0 && (
                <div style={LIFESPAN_ROW}>
                  <span style={LIFESPAN_VALUE}>
                    {leavingUnits.length} of these leave during the story
                  </span>
                  <button
                    className={styles.cancelButton}
                    style={SMALL_BUTTON}
                    title="Keep them until the end of the story"
                    onClick={() =>
                      bringBackUnits(leavingUnits.map((unit) => unit.id))
                    }
                  >
                    Bring back
                  </button>
                </div>
              )}
              <p className={styles.hint}>
                Units placed with the playhead past the story's start appear
                then. Deleting a unit there makes it leave at that moment. Each
                unit can be moved only at the moment it appears.
              </p>
            </div>
          )}

          {paths.length === 0 && (
            <p className={styles.emptyMessage}>
              No paths yet. Click "New path" to draw one.
            </p>
          )}
          {paths.map((path) => {
            const isSelected = path.id === selectedPathId;
            return (
              <div
                key={path.id}
                className={`${styles.row} ${isSelected ? styles.rowActive : ""}`}
                onClick={() => selectPath(isSelected ? null : path.id)}
              >
                {renamingId === path.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className={styles.renameInput}
                  />
                ) : (
                  <span
                    className={`${styles.name} ${isSelected ? styles.nameActive : ""}`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startRename(path.id, path.name);
                    }}
                  >
                    {path.name}
                  </span>
                )}
                {path.assignments.length > 0 && (
                  <span className={styles.count}>
                    {path.assignments.length}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePath(path.id);
                  }}
                  title="Delete path"
                  className={deleteStyles.deleteButton}
                >
                  ×
                </button>
              </div>
            );
          })}

          {selectedPath && (
            <div className={styles.section}>
              <p className={styles.sectionTitle}>
                {selectedPath.name}: attached units
              </p>
              {attachedUnits.length === 0 && (
                <p className={styles.hint}>
                  None yet. Select units, then click this path on the map.
                </p>
              )}
              {attachedUnits.map((unit) => (
                <div key={unit.id} className={styles.unitRow}>
                  <img
                    src={`${API_BASE_URL}/api/projects/${currentProjectName}/assets/${unit.assetType}/${unit.path ?? unit.filename}`}
                    alt={unit.filename}
                    className={styles.unitThumb}
                    draggable={false}
                  />
                  <span className={styles.unitName}>{displayName(unit)}</span>
                  <button
                    onClick={() => detachUnitFromPath(selectedPath.id, unit.id)}
                    title="Detach from this path"
                    className={deleteStyles.deleteButton}
                  >
                    ×
                  </button>
                </div>
              ))}

              {attachedUnits.length > 0 && (
                <>
                  <div className={styles.segment}>
                    {FORMATION_MODES.map(({ mode, label, hint }) => (
                      <button
                        key={mode}
                        title={hint}
                        className={`${styles.segmentButton} ${
                          formationMode === mode ? styles.segmentActive : ""
                        }`}
                        onClick={() => setFormationMode(selectedPath.id, mode)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className={styles.hint}>
                    {
                      FORMATION_MODES.find((m) => m.mode === formationMode)
                        ?.hint
                    }
                  </p>
                  <button
                    className={styles.cancelButton}
                    title="Use where the units are, and the way they face, as the formation"
                    onClick={() => refreshPathFormation(selectedPath.id)}
                  >
                    Re-record formation
                  </button>

                  <div className={styles.preview}>
                    <div className={styles.actions}>
                      <button
                        className={styles.finishButton}
                        onClick={() => {
                          useTimelineStore.getState().pause();
                          setIsPlaying((playing) => !playing);
                        }}
                      >
                        {isPlaying ? "Pause" : "Play"}
                      </button>
                      <button
                        className={styles.cancelButton}
                        onClick={() => {
                          setIsPlaying(false);
                          clearPreview();
                        }}
                      >
                        Reset
                      </button>
                    </div>
                    <div className={styles.segment}>
                      {SPEEDS.map((speed) => (
                        <button
                          key={speed}
                          title={`${speed}x speed`}
                          className={`${styles.segmentButton} ${
                            playbackSpeed === speed ? styles.segmentActive : ""
                          }`}
                          onClick={() => setPlaybackSpeed(speed)}
                        >
                          {speed}×
                        </button>
                      ))}
                    </div>
                    <PlaybackSlider
                      pathId={selectedPath.id}
                      onScrub={() => {
                        setIsPlaying(false);
                        useTimelineStore.getState().pause();
                      }}
                    />
                    <p className={styles.hint}>
                      Preview only: your units go back to their real positions
                      when you move the mouse off the toolbar.
                    </p>
                  </div>
                </>
              )}

              <p className={styles.hint}>
                Before setting off, the group pivots on the spot until its
                turning units face the path. Drag a dot to move it. Click the
                line to add a dot (deselect your units first). Select a dot and
                press Backspace to remove it. Double-click a name to rename it.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PathsPanel;
