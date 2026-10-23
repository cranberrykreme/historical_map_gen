import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAssetStore } from "../../store/useAssetStore";
import { useMapStore } from "../../store/useMapStore";
import { useTimelineStore } from "../../store/useTimelineStore";
import { FRAME_PIXELS } from "../../utils/video/camera";
import { formatSeconds } from "../../utils/video/shots";
import { VideoFrame } from "../../types";
import {
  cleanName,
  DEFAULT_FPS,
  formatBytes,
  formatDuration,
  frameCount,
  FRAME_RATES,
  QUALITIES,
  RenderProgress,
  RenderQuality,
  secondsLeft,
  shotRange,
  wholeVideo,
} from "../../render/frames";
import {
  deleteExport,
  downloadExport,
  ExportedVideo,
  exportUrl,
  FinishedRender,
  listExports,
} from "../../render/renderApi";
import {
  measuredSecondsPerFrame,
  RenderCancelled,
  renderVideo,
} from "../../render/renderVideo";
import styles from "./RenderDialog.module.css";

type RangeChoice = "whole" | "shot";

type Phase =
  | { kind: "settings" }
  | { kind: "rendering"; progress: RenderProgress | null }
  | { kind: "done"; result: FinishedRender }
  | { kind: "failed"; message: string };

const SHAPES: { frame: VideoFrame; label: string }[] = [
  { frame: "landscape", label: "16:9" },
  { frame: "portrait", label: "9:16" },
];

// The last choices made, kept while the page is open so the next render starts from them
let remembered: { fps: number; quality: RenderQuality } = {
  fps: DEFAULT_FPS,
  quality: "high",
};

function Choices<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string; hint?: string; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <span className={styles.choices}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          className={`${styles.choice} ${option.value === value ? styles.chosen : ""}`}
          title={option.hint}
          disabled={disabled || option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </span>
  );
}

const savedAt = (seconds: number) =>
  new Date(seconds * 1000).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// Renders the video to an MP4 in the project's exports folder: its shape, frame rate and
// quality, the whole video or just the selected shot, and the file's name. Shows the progress,
// then the finished file, and lists the videos rendered before, to open, download or delete.
// It can't be closed while a render runs (Cancel stops it).
function RenderDialog({ onClose }: { onClose: () => void }) {
  const project = useAssetStore((state) => state.currentProjectName) ?? "";
  const shots = useMapStore((state) => state.shots);
  const selectedShotId = useMapStore((state) => state.selectedShotId);
  const videoFrame = useMapStore((state) => state.videoFrame);
  const setVideoFrame = useMapStore((state) => state.setVideoFrame);

  const shotIndex = shots.findIndex((shot) => shot.id === selectedShotId);
  const selectedShot = shotIndex >= 0 ? shots[shotIndex] : null;

  const [fps, setFps] = useState(remembered.fps);
  const [quality, setQuality] = useState<RenderQuality>(remembered.quality);
  const [rangeChoice, setRangeChoice] = useState<RangeChoice>(
    selectedShot ? "shot" : "whole"
  );
  const [nameEdited, setNameEdited] = useState(false);
  const defaultName = cleanName(
    rangeChoice === "shot" && selectedShot
      ? `${project}-${selectedShot.name}`
      : project
  );
  const [name, setName] = useState(defaultName);
  const [phase, setPhase] = useState<Phase>({ kind: "settings" });
  const [exports, setExports] = useState<ExportedVideo[] | null>(null);
  // The earlier video waiting for "Delete" to be confirmed, and any problem deleting one
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // The name follows the range until it's typed over
  useEffect(() => {
    if (!nameEdited) setName(defaultName);
  }, [defaultName, nameEdited]);

  // The shot can't be rendered on its own once it's no longer selected
  useEffect(() => {
    if (!selectedShot && rangeChoice === "shot") setRangeChoice("whole");
  }, [selectedShot, rangeChoice]);

  const refreshExports = useCallback(() => {
    if (!project) return;
    listExports(project)
      .then(setExports)
      .catch((error) => {
        // Keep showing what was listed before, rather than emptying the list
        console.error("Couldn't list the rendered videos:", error);
        setExports((current) => current ?? []);
      });
  }, [project]);
  useEffect(refreshExports, [refreshExports]);

  const rendering = phase.kind === "rendering";

  // Escape closes it, unless a render is running
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !rendering) {
        e.preventDefault(); // so the side panel doesn't close too
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, rendering]);

  // Closing the page mid-render asks first; leaving the project stops the render
  useEffect(() => {
    if (!rendering) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [rendering]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const range =
    rangeChoice === "shot" && shotIndex >= 0
      ? shotRange(shots, shotIndex)
      : wholeVideo(shots);
  const length = range ? range.to - range.from : 0;
  const frames = frameCount(length, fps);
  const pace = measuredSecondsPerFrame();
  const { width, height } = FRAME_PIXELS[videoFrame];
  const settings = QUALITIES[quality];

  const start = async () => {
    if (!range) return;
    remembered = { fps, quality };
    useTimelineStore.getState().pause();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ kind: "rendering", progress: null });
    try {
      const result = await renderVideo({
        fps,
        crf: settings.crf,
        preset: settings.preset,
        range,
        name: cleanName(name || defaultName),
        signal: controller.signal,
        onProgress: (progress) => setPhase({ kind: "rendering", progress }),
      });
      setPhase({ kind: "done", result });
    } catch (error) {
      if (error instanceof RenderCancelled) setPhase({ kind: "settings" });
      else {
        console.error("The render failed:", error);
        setPhase({
          kind: "failed",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      refreshExports();
    }
  };

  const remove = async (filename: string) => {
    setDeleting(filename);
    setListError(null);
    try {
      await deleteExport(project, filename);
      setExports(
        (current) => current?.filter((v) => v.filename !== filename) ?? null
      );
      // The video just rendered can't be opened once it's gone
      if (phase.kind === "done" && phase.result.filename === filename)
        setPhase({ kind: "settings" });
      refreshExports();
    } catch (error) {
      // A fetch that can't reach the server at all only says "Failed to fetch"
      const message = error instanceof Error ? error.message : String(error);
      setListError(
        error instanceof TypeError
          ? `Couldn't reach the server to delete ${filename}. Is Flask running?`
          : message
      );
    } finally {
      setDeleting(null);
      setConfirming(null);
    }
  };

  const open = (filename: string) =>
    window.open(exportUrl(project, filename), "_blank");

  const settingsView = (
    <>
      <div className={styles.grid}>
        <span className={styles.label}>Shape</span>
        <span className={styles.row}>
          <Choices
            options={SHAPES.map(({ frame, label }) => ({
              value: frame,
              label,
            }))}
            value={videoFrame}
            onChange={setVideoFrame}
          />
          <span className={styles.hint}>
            {width}×{height} · also changes the editor's frame
          </span>
        </span>

        <span className={styles.label}>Frame rate</span>
        <span className={styles.row}>
          <Choices
            options={FRAME_RATES.map((rate) => ({
              value: rate,
              label: `${rate}`,
            }))}
            value={fps}
            onChange={setFps}
          />
          <span className={styles.hint}>frames per second</span>
        </span>

        <span className={styles.label}>Quality</span>
        <span className={styles.row}>
          <Choices
            options={(Object.keys(QUALITIES) as RenderQuality[]).map((key) => ({
              value: key,
              label: QUALITIES[key].label,
              hint: QUALITIES[key].hint,
            }))}
            value={quality}
            onChange={setQuality}
          />
          <span className={styles.hint}>{settings.hint}</span>
        </span>

        <span className={styles.label}>Render</span>
        <span className={styles.row}>
          <Choices
            options={[
              {
                value: "whole" as RangeChoice,
                label: `Whole video (${formatSeconds(wholeVideo(shots).to)})`,
              },
              {
                value: "shot" as RangeChoice,
                label: selectedShot
                  ? `“${selectedShot.name}” only`
                  : "Selected shot only",
                hint: selectedShot
                  ? "Just this shot, with the halves of the transitions either side"
                  : "Select a shot on the video strip first",
                disabled: !selectedShot,
              },
            ]}
            value={rangeChoice}
            onChange={setRangeChoice}
          />
        </span>

        <span className={styles.label}>File name</span>
        <span className={styles.row}>
          <input
            className={styles.input}
            value={name}
            spellCheck={false}
            onChange={(e) => {
              setNameEdited(true);
              setName(e.target.value);
            }}
            onBlur={() => {
              if (!name.trim()) {
                setNameEdited(false);
                setName(defaultName);
              }
            }}
          />
          <span className={styles.hint}>
            → {cleanName(name || defaultName)}-<i>date-time</i>.mp4
          </span>
        </span>
      </div>

      <div className={styles.summary}>
        {frames} frames · {formatSeconds(length)} of video
        {pace !== null
          ? ` · about ${formatDuration(frames * pace)} to render`
          : " · the first render shows how long renders take here"}
      </div>

      <div className={styles.footer}>
        <button className={styles.button} onClick={onClose}>
          Close
        </button>
        <button
          className={`${styles.button} ${styles.primary}`}
          onClick={start}
          disabled={!range || length <= 0}
        >
          Render
        </button>
      </div>
    </>
  );

  let main: React.ReactNode = settingsView;

  if (phase.kind === "rendering") {
    const progress = phase.progress;
    const percent = progress ? (100 * progress.done) / progress.total : 0;
    const left = progress
      ? secondsLeft(progress.done, progress.total, progress.elapsed)
      : null;
    main = (
      <>
        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
        <div className={styles.status}>
          <span>
            {progress
              ? `Rendering ${Math.floor(percent)}% · frame ${progress.done} of ${progress.total}`
              : "Getting ready…"}
          </span>
          <span>{left !== null ? `${formatDuration(left)} left` : ""}</span>
        </div>
        <div className={styles.footer}>
          <button
            className={styles.button}
            onClick={() => abortRef.current?.abort()}
            title="Stop rendering and throw the half-made video away"
          >
            Cancel
          </button>
        </div>
      </>
    );
  }

  if (phase.kind === "done") {
    const { result } = phase;
    main = (
      <>
        <div className={styles.saved}>
          Saved {result.filename} · {formatBytes(result.bytes)} · took{" "}
          {formatDuration(result.tookSeconds)}
        </div>
        <div className={styles.path}>{result.path}</div>
        <div className={styles.footer}>
          <button
            className={styles.button}
            onClick={() => setPhase({ kind: "settings" })}
          >
            Render another
          </button>
          <button
            className={styles.button}
            onClick={() => downloadExport(project, result.filename)}
          >
            Download
          </button>
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={() => open(result.filename)}
          >
            Open
          </button>
        </div>
      </>
    );
  }

  if (phase.kind === "failed") {
    main = (
      <>
        <div className={styles.error}>The render failed: {phase.message}</div>
        <div className={styles.footer}>
          <button
            className={styles.button}
            onClick={() => setPhase({ kind: "settings" })}
          >
            Back
          </button>
        </div>
      </>
    );
  }

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={() => {
        if (!rendering) onClose();
      }}
    >
      <div className={styles.panel} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Render video</span>
          <button
            className={styles.button}
            onClick={onClose}
            disabled={rendering}
            title={rendering ? "Cancel the render first" : "Close (Esc)"}
          >
            ×
          </button>
        </div>
        <div className={styles.body}>
          {main}
          {!rendering && ((exports && exports.length > 0) || listError) && (
            <>
              <div className={styles.listTitle}>
                Rendered before (in the project's exports folder)
              </div>
              {listError && <div className={styles.error}>{listError}</div>}
              <div className={styles.list}>
                {(exports ?? []).map((video) =>
                  confirming === video.filename ? (
                    <div key={video.filename} className={styles.item}>
                      <span className={`${styles.itemName} ${styles.error}`}>
                        Delete {video.filename} for good?
                      </span>
                      <button
                        className={`${styles.button} ${styles.danger}`}
                        onClick={() => remove(video.filename)}
                        disabled={deleting !== null}
                      >
                        {deleting === video.filename ? "Deleting…" : "Delete"}
                      </button>
                      <button
                        className={styles.button}
                        onClick={() => setConfirming(null)}
                        disabled={deleting !== null}
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <div key={video.filename} className={styles.item}>
                      <span className={styles.itemName} title={video.filename}>
                        {video.filename}
                      </span>
                      <span className={styles.itemMeta}>
                        {formatBytes(video.bytes)} · {savedAt(video.modified)}
                      </span>
                      <button
                        className={styles.button}
                        onClick={() => open(video.filename)}
                      >
                        Open
                      </button>
                      <button
                        className={styles.button}
                        onClick={() => downloadExport(project, video.filename)}
                      >
                        Download
                      </button>
                      <button
                        className={styles.button}
                        onClick={() => {
                          setListError(null);
                          setConfirming(video.filename);
                        }}
                        disabled={deleting !== null}
                        title="Delete this video from the exports folder"
                      >
                        Delete
                      </button>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default RenderDialog;
