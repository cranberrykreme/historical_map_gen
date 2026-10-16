import React, { useEffect, useState } from "react";
import { useMapStore } from "../../store/useMapStore";
import { useBlockToolStore } from "../../store/useBlockToolStore";
import { usePathToolStore } from "../../store/usePathToolStore";
import { useTerrainToolStore } from "../../store/useTerrainToolStore";
import { FormationBlock } from "../../types";
import { BLOCK_COLOURS, BLOCK_KINDS, unitLabel } from "../../utils/blocks";
import BlockShape from "../BlockShape";
import styles from "../toolbar/PathsPanel.module.css";

const FIELD_ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "var(--color-text-secondary)",
  fontFamily: "var(--font-ui)",
  fontSize: "var(--font-size-sm)",
};
const FIELD_LABEL: React.CSSProperties = { width: 40, flexShrink: 0 };
const INPUT: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  boxSizing: "border-box",
};
const SWATCHES: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
};
const swatch = (
  fill: string,
  edge: string,
  active: boolean
): React.CSSProperties => ({
  width: 20,
  height: 20,
  padding: 0,
  borderRadius: 3,
  background: fill,
  border: `2px solid ${active ? "#f1e4b8" : edge}`,
  boxShadow: active ? "0 0 0 1px #c8a84b" : "none",
  cursor: "pointer",
});
const PREVIEW: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "8px 0",
  background: "rgba(143, 174, 98, 0.35)",
  borderRadius: 4,
};

// A text box that keeps what's typed and hands it over when you leave it or press Enter
function CommitInput({
  value,
  placeholder,
  onCommit,
}: {
  value: string;
  placeholder: string;
  onCommit: (text: string) => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <input
      className={styles.renameInput}
      style={INPUT}
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onCommit(text)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setText(value);
      }}
    />
  );
}

// A block's kind, colour, name and size. `live` text boxes change the block as you type (the
// block being set up); otherwise they change it when you leave the box (a placed block, so each
// change is one undo step).
function BlockFields({
  block,
  onChange,
  live,
}: {
  block: FormationBlock;
  onChange: (patch: Partial<FormationBlock>) => void;
  live: boolean;
}) {
  const textField = (field: "name" | "size", placeholder: string) =>
    live ? (
      <input
        className={styles.renameInput}
        style={INPUT}
        value={block[field] ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange({ [field]: e.target.value })}
        onKeyDown={(e) => e.stopPropagation()}
      />
    ) : (
      <CommitInput
        value={block[field] ?? ""}
        placeholder={placeholder}
        onCommit={(text) => onChange({ [field]: text })}
      />
    );
  return (
    <>
      <div className={styles.segment}>
        {BLOCK_KINDS.map(({ kind, label, hint }) => (
          <button
            key={kind}
            title={hint}
            className={`${styles.segmentButton} ${block.kind === kind ? styles.segmentActive : ""}`}
            onClick={() => onChange({ kind })}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={SWATCHES}>
        {BLOCK_COLOURS.map(({ colour, label, fill, edge }) => (
          <button
            key={colour}
            title={label}
            aria-label={label}
            style={swatch(fill, edge, block.colour === colour)}
            onClick={() => onChange({ colour })}
          />
        ))}
      </div>
      <label style={FIELD_ROW}>
        <span style={FIELD_LABEL}>Name</span>
        {textField("name", "e.g. Breton cavalry")}
      </label>
      <label style={FIELD_ROW}>
        <span style={FIELD_LABEL}>Size</span>
        {textField("size", "e.g. c. 2,000 (optional)")}
      </label>
    </>
  );
}

// Formation blocks: troops drawn as history books draw them. With one block selected, this
// changes it; otherwise it sets up a new one to place with a click on the map.
function BlocksSection() {
  const placedUnits = useMapStore((state) => state.placedUnits);
  const selectedUnitIds = useMapStore((state) => state.selectedUnitIds);
  const updateBlock = useMapStore((state) => state.updateBlock);
  const draft = useBlockToolStore((state) => state.draft);
  const placing = useBlockToolStore((state) => state.placing);
  const tool = useBlockToolStore.getState;

  const selected =
    selectedUnitIds.size === 1
      ? (placedUnits.find((u) => selectedUnitIds.has(u.id) && u.block) ?? null)
      : null;

  const place = () => {
    // one tool at a time
    usePathToolStore.getState().cancelDrawing();
    const terrain = useTerrainToolStore.getState();
    terrain.stopDrawing();
    terrain.setBrush(null);
    terrain.setEditing(false);
    tool().startPlacing();
  };

  if (selected?.block) {
    const block = selected.block;
    return (
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Block: {unitLabel(selected)}</p>
        <BlockFields
          key={selected.id}
          block={block}
          live={false}
          onChange={(patch) => updateBlock(selected.id, patch)}
        />
        <p className={styles.hint}>
          On the map, drag the side handles to widen it, the back one to deepen
          it, and the front diamond to bend it into an arc. Turn it with the
          round handle above it.
        </p>
        {(block.bend ?? 0) !== 0 && (
          <button
            className={styles.cancelButton}
            onClick={() => updateBlock(selected.id, { bend: 0 })}
          >
            Straighten
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>Formation blocks</p>
      <BlockFields
        block={draft}
        live
        onChange={(patch) => tool().setDraft(patch)}
      />
      <div style={PREVIEW}>
        <BlockShape block={draft} fit={{ width: 200, height: 70 }} />
      </div>
      {placing ? (
        <div className={styles.actions}>
          <span className={styles.hint} style={{ flex: 1 }}>
            Click the map to place it · Esc cancels
          </span>
          <button
            className={styles.cancelButton}
            onClick={() => tool().stopPlacing()}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          className={styles.finishButton}
          title="Click the map to put this block down"
          onClick={place}
        >
          Place on map
        </button>
      )}
    </div>
  );
}

export default BlocksSection;
