import React from "react";
import { useCameraStore } from "../../store/useCameraStore";
import { useMapStore } from "../../store/useMapStore";
import {
  CameraView,
  MAP_SCENE,
  Shot,
  TransitionKind,
  WipeDirection,
} from "../../types";
import {
  armySeenInShot,
  cameraInShot,
  shotCameras,
  shotScene,
} from "../../utils/camera";
import {
  DEFAULT_TRANSITION_SECONDS,
  MIN_TRANSITION_SECONDS,
} from "../../utils/shots";
import { openingView } from "../../hooks/useVideoCamera";
import useSceneCameras from "../../hooks/useSceneCameras";
import { useTimelineStore } from "../../store/useTimelineStore";
import { NumberField } from "./fields";
import styles from "./Timeline.module.css";

const KINDS: { kind: TransitionKind; label: string }[] = [
  { kind: "cut", label: "Cut" },
  { kind: "fade", label: "Fade" },
  { kind: "dissolve", label: "Dissolve" },
  { kind: "wipe", label: "Wipe" },
];

const DIRECTIONS: { direction: WipeDirection; label: string }[] = [
  { direction: "left", label: "← Left" },
  { direction: "right", label: "→ Right" },
  { direction: "up", label: "↑ Up" },
  { direction: "down", label: "↓ Down" },
];

// One end of the shot's camera: set it from what the frame shows, go to it, or clear it
function ViewControls({
  label,
  own,
  resolved,
  locked,
  lockedHint,
  emptyHint,
  canSet,
  onSet,
  onClear,
}: {
  label: string;
  own: CameraView | undefined; // the view this shot sets, if any
  resolved: CameraView | null; // where the camera actually is, own view or not
  locked: boolean;
  lockedHint: string;
  emptyHint: string;
  canSet: boolean; // the frame is only on screen in video mode
  onSet: () => void;
  onClear: () => void;
}) {
  const go = () => {
    if (resolved) useCameraStore.getState().api?.show(resolved);
  };
  return (
    <span className={styles.field}>
      <span className={styles.editorLabel}>{label}</span>
      <button
        className={styles.textButton}
        onClick={onSet}
        disabled={locked || !canSet}
        title={
          locked
            ? lockedHint
            : !canSet
              ? "Switch to Video mode (on this shot) to see the frame and set this view"
              : `Use what the frame shows now as this shot's ${label.toLowerCase()} view`
        }
      >
        Set
      </button>
      <button
        className={styles.textButton}
        onClick={go}
        disabled={!resolved}
        title={
          resolved
            ? `Move the map to this shot's ${label.toLowerCase()} view`
            : "Nothing sets where the camera is yet"
        }
      >
        Go
      </button>
      <button
        className={styles.textButton}
        onClick={onClear}
        disabled={!own || locked}
        title={`Forget this shot's ${label.toLowerCase()} view`}
      >
        ×
      </button>
      <span className={styles.editorDim}>
        {locked ? "follows on" : own ? "set" : emptyHint}
      </span>
    </span>
  );
}

// The selected shot's camera and how the video comes into it: its start and end views,
// following on from the shot before, the army it follows, and the transition across the cut.
// The last shot also says how the video ends.
function ShotCamera({ shot }: { shot: Shot }) {
  const shots = useMapStore((state) => state.shots);
  const updateShot = useMapStore((state) => state.updateShot);

  const savedViewport = useMapStore((state) => state.savedViewport);
  const activeSceneId = useMapStore((state) => state.activeSceneId);
  const sceneStash = useMapStore((state) => state.sceneStash);
  const activeArmies = useMapStore((state) => state.armies);
  const api = useCameraStore((state) => state.api);
  const inVideo = useTimelineStore((state) => state.mode === "video");
  const { tracker: mainTracker, battles } = useSceneCameras();

  // The shot films one scene: its armies and tracker come from that scene,
  // and its views can only be set while that scene is open
  const scene = shotScene(shot);
  const tracker =
    scene === MAP_SCENE ? mainTracker : (battles.tracker(scene) ?? mainTracker);
  const armies =
    scene === activeSceneId ? activeArmies : (sceneStash[scene]?.armies ?? []);
  const sceneOpen = scene === activeSceneId;

  const index = shots.findIndex((s) => s.id === shot.id);
  const first = index === 0;
  const last = index === shots.length - 1;
  // Where each end of the camera really is, opening on the project's saved view
  const opening = savedViewport && api ? openingView() : null;
  const camera =
    shotCameras(shots, opening, mainTracker, battles)[index] ?? null;
  // Where the camera really is at each end, following the army if the shot does
  const startView = camera ? cameraInShot(shot, camera, 0, tracker) : null;
  const endView = camera
    ? cameraInShot(shot, camera, shot.seconds, tracker)
    : null;
  const followed = armies.find((army) => army.id === shot.follow);
  const following = !!shot.followOn && !first;

  // What the frame shows right now, if the map is on screen
  const viewNow = () => useCameraStore.getState().api?.viewNow() ?? null;
  const setView = (end: "startView" | "endView") => {
    const view = viewNow();
    if (view) updateShot(shot.id, { [end]: view });
  };

  const transition = shot.transition;
  const kind: TransitionKind = transition?.kind ?? "cut";
  const changeKind = (next: TransitionKind) =>
    updateShot(shot.id, {
      transition:
        next === "cut"
          ? undefined
          : {
              kind: next,
              seconds: transition?.seconds ?? DEFAULT_TRANSITION_SECONDS,
              direction: transition?.direction,
            },
    });

  return (
    <div className={styles.editor}>
      <span className={styles.editorTitle}>Camera</span>
      <ViewControls
        label="Start"
        own={shot.startView}
        resolved={startView}
        locked={following}
        lockedHint="Following on: this shot starts where the one before it ends"
        emptyHint={
          first ? (savedViewport ? "project view" : "not set") : "carries on"
        }
        canSet={inVideo && sceneOpen}
        onSet={() => setView("startView")}
        onClear={() => updateShot(shot.id, { startView: undefined })}
      />
      <ViewControls
        label="End"
        own={shot.endView}
        resolved={endView}
        locked={false}
        lockedHint=""
        emptyHint="holds"
        canSet={inVideo && sceneOpen}
        onSet={() => setView("endView")}
        onClear={() => updateShot(shot.id, { endView: undefined })}
      />
      <label
        className={styles.editorCheck}
        title={
          first
            ? "The first shot has nothing before it to follow on from"
            : "Start where the shot before ends, so the camera keeps moving across the cut"
        }
      >
        <input
          type="checkbox"
          checked={following}
          disabled={first}
          onChange={(e) => updateShot(shot.id, { followOn: e.target.checked })}
        />
        Follow on
      </label>
      <span className={styles.field}>
        <span className={styles.editorLabel}>Follow</span>
        <select
          className={styles.editorSelect}
          value={shot.follow ?? ""}
          title="Keep an army in the middle of the frame through this shot. The start and end views still set how far in the camera is."
          onChange={(e) =>
            updateShot(shot.id, { follow: e.target.value || undefined })
          }
        >
          <option value="">Nobody</option>
          {armies.map((army) => (
            <option key={army.id} value={army.id}>
              {army.name}
              {armySeenInShot(shot, army.id, tracker)
                ? ""
                : " (no units in this shot)"}
            </option>
          ))}
          {shot.follow && !followed && (
            <option value={shot.follow}>(army deleted)</option>
          )}
        </select>
      </span>
      <span className={styles.field}>
        <span className={styles.editorLabel}>{first ? "Opening" : "In"}</span>
        <select
          className={styles.editorSelect}
          value={kind}
          title={
            first
              ? "How the video opens: straight in, or in from black"
              : "How the video goes from the shot before into this one"
          }
          onChange={(e) => changeKind(e.target.value as TransitionKind)}
        >
          {KINDS.filter(
            // The video can only open straight in or fade in from black
            ({ kind: option }) =>
              !first || option === "cut" || option === "fade"
          ).map(({ kind: option, label }) => (
            <option key={option} value={option}>
              {first && option === "fade" ? "Fade from black" : label}
            </option>
          ))}
        </select>
        {transition && (
          <>
            <NumberField
              value={Math.round(transition.seconds * 10) / 10}
              min={MIN_TRANSITION_SECONDS}
              width={48}
              title="How long the transition takes, in seconds (half each side of the cut)"
              onCommit={(seconds) =>
                updateShot(shot.id, { transition: { ...transition, seconds } })
              }
            />
            <span className={styles.editorDim}>s</span>
          </>
        )}
        {transition?.kind === "wipe" && (
          <select
            className={styles.editorSelect}
            value={transition.direction ?? "left"}
            title="Which way the new picture slides in"
            onChange={(e) =>
              updateShot(shot.id, {
                transition: {
                  ...transition,
                  direction: e.target.value as WipeDirection,
                },
              })
            }
          >
            {DIRECTIONS.map(({ direction, label }) => (
              <option key={direction} value={direction}>
                {label}
              </option>
            ))}
          </select>
        )}
      </span>
      {last && (
        <span className={styles.field}>
          <span className={styles.editorLabel}>Out</span>
          <select
            className={styles.editorSelect}
            value={shot.fadeOut ? "fade" : "cut"}
            title="How the video ends: straight out, or fading to black"
            onChange={(e) =>
              updateShot(shot.id, {
                fadeOut:
                  e.target.value === "fade"
                    ? DEFAULT_TRANSITION_SECONDS
                    : undefined,
              })
            }
          >
            <option value="cut">Cut</option>
            <option value="fade">Fade to black</option>
          </select>
          {shot.fadeOut && (
            <>
              <NumberField
                value={Math.round(shot.fadeOut * 10) / 10}
                min={MIN_TRANSITION_SECONDS}
                width={48}
                title="How long the fade to black takes, in seconds, at the very end"
                onCommit={(fadeOut) => updateShot(shot.id, { fadeOut })}
              />
              <span className={styles.editorDim}>s</span>
            </>
          )}
        </span>
      )}
    </div>
  );
}

export default ShotCamera;
