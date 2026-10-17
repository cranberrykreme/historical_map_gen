import React, { useEffect, useState } from "react";
import ToolbarButton from "../toolbar/ToolbarButton";
import { useMapStore } from "../../store/useMapStore";
import { currentMoment, useTimelineStore } from "../../store/useTimelineStore";
import { BlockLoss, Unit } from "../../types";
import { blockStrength, sizeAtStrength } from "../../utils/blocks";
import { formatHistoryTime, HOUR } from "../../utils/historyTime";
import deleteStyles from "../toolbar/DeleteButton.module.css";
import styles from "../toolbar/PathsPanel.module.css";

const LOSS: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: "6px 0",
  borderTop: "1px solid var(--color-border)",
};
const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "var(--color-text-secondary)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-sm)",
};
const LABEL: React.CSSProperties = {
  width: 36,
  flexShrink: 0,
  color: "var(--color-text-dim)",
};
const WHEN: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const SMALL_BUTTON: React.CSSProperties = {
  width: "auto",
  padding: "1px 6px",
  flexShrink: 0,
};
const PERCENT_INPUT: React.CSSProperties = {
  width: 52,
  flex: "none",
  boxSizing: "border-box",
};

// A percentage box that keeps what's typed and hands it over when you leave it or press Enter
function PercentInput({
  share,
  onCommit,
}: {
  share: number;
  onCommit: (share: number) => void;
}) {
  const shown = String(Math.round(share * 100));
  const [text, setText] = useState(shown);
  useEffect(() => setText(shown), [shown]);
  const commit = () => {
    const n = Number(text);
    if (Number.isFinite(n) && n > 0) onCommit(n / 100);
    else setText(shown);
  };
  return (
    <input
      className={styles.renameInput}
      style={PERCENT_INPUT}
      inputMode="numeric"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setText(shown);
      }}
    />
  );
}

// A selected block's losses: each one thins it steadily between two moments, its back edge
// coming forward and the number in its size counting down. Added at the playhead; the start
// and end are set by moving the playhead and clicking "Here".
function BlockLosses({ unit }: { unit: Unit }) {
  const updateBlock = useMapStore((state) => state.updateBlock);
  const storyStart = useMapStore((state) => state.storyStart);
  const now = useTimelineStore((state) => state.now);
  const block = unit.block;
  if (!block) return null;
  const losses = block.losses ?? [];
  const moment = currentMoment(now, storyStart);
  const strength = blockStrength(block, moment);

  const save = (next: BlockLoss[]) => updateBlock(unit.id, { losses: next });
  const change = (index: number, patch: Partial<BlockLoss>) =>
    save(losses.map((loss, i) => (i === index ? { ...loss, ...patch } : loss)));

  return (
    <>
      {losses.length === 0 && (
        <p className={styles.hint}>
          None yet. A loss thins the block steadily between two moments, and
          counts down the number in its size.
        </p>
      )}
      {losses.map((loss, index) => (
        <div key={index} style={LOSS}>
          <div style={ROW}>
            <span style={LABEL}>Loses</span>
            <PercentInput
              share={loss.share}
              onCommit={(share) => change(index, { share })}
            />
            <span style={{ flex: 1 }}>%</span>
            <button
              onClick={() => save(losses.filter((_, i) => i !== index))}
              title="Remove this loss"
              className={deleteStyles.deleteButton}
            >
              ×
            </button>
          </div>
          {(["start", "end"] as const).map((edge) => (
            <div key={edge} style={ROW}>
              <span style={LABEL}>{edge === "start" ? "From" : "To"}</span>
              <span style={WHEN} title={formatHistoryTime(loss[edge], "times")}>
                {formatHistoryTime(loss[edge], "times")}
              </span>
              <button
                className={styles.cancelButton}
                style={SMALL_BUTTON}
                title={`Set the ${edge} of this loss to the playhead`}
                onClick={() => change(index, { [edge]: moment })}
              >
                Here
              </button>
            </div>
          ))}
        </div>
      ))}
      <ToolbarButton
        icon="+"
        label="Add a loss at the playhead"
        hint="Add a loss starting at the playhead, over two hours"
        isExpanded={true}
        onClick={() =>
          save([
            ...losses,
            { start: moment, end: moment + 2 * HOUR, share: 0.25 },
          ])
        }
      />
      {losses.length > 0 && (
        <p className={styles.hint}>
          At the playhead: {Math.round(strength * 100)}% strength
          {block.size && strength < 1
            ? `, ${sizeAtStrength(block.size, strength)}`
            : ""}
          .
        </p>
      )}
    </>
  );
}

export default BlockLosses;
