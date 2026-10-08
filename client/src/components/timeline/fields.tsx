import React, { useEffect, useState } from "react";
import { HistoryTime } from "../../utils/historyTime";
import {
  durationFields,
  fromDurationFields,
  fromMomentFields,
  momentFields,
  MomentFields,
  DurationFields,
} from "../../utils/historyEdit";
import { MONTH_NAMES } from "../../utils/dates";
import styles from "./Timeline.module.css";

const pad2 = (n: number) => String(n).padStart(2, "0");

// A number box that applies what you typed when you leave it or press Enter, so typing a
// year isn't a string of undo steps. Anything that isn't a number puts the old value back.
export function NumberField({
  value,
  min,
  max,
  width,
  title,
  padded,
  onCommit,
}: {
  value: number;
  min: number;
  max?: number;
  width: number;
  title: string;
  padded?: boolean;
  onCommit: (value: number) => void;
}) {
  const shown = padded ? pad2(value) : String(value);
  const [draft, setDraft] = useState(shown);

  // Follow the value when it changes elsewhere (undo, dragging the bar, another field)
  useEffect(() => setDraft(shown), [shown]);

  const finish = () => {
    const typed = Number(draft);
    setDraft(shown);
    if (draft.trim() === "" || !Number.isFinite(typed) || typed === value)
      return;
    onCommit(typed);
  };

  return (
    <input
      type="number"
      className={styles.editorInput}
      style={{ width }}
      min={min}
      max={max}
      value={draft}
      title={title}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={finish}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

// A moment in history as day, month, year and time of day
export function MomentInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: HistoryTime;
  onCommit: (t: HistoryTime) => void;
}) {
  const fields = momentFields(value);
  const change = (patch: Partial<MomentFields>) => {
    const next = fromMomentFields({ ...fields, ...patch });
    if (next !== value) onCommit(next);
  };

  return (
    <span className={styles.field}>
      <span className={styles.editorLabel}>{label}</span>
      <NumberField
        value={fields.day}
        min={1}
        max={31}
        width={44}
        title="Day"
        onCommit={(day) => change({ day })}
      />
      <select
        className={styles.editorSelect}
        value={fields.month}
        title="Month"
        onChange={(e) => change({ month: Number(e.target.value) })}
      >
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </select>
      <NumberField
        value={fields.year}
        min={1}
        max={9999}
        width={64}
        title="Year"
        onCommit={(year) => change({ year })}
      />
      <NumberField
        value={fields.hour}
        min={0}
        max={23}
        width={42}
        title="Hour (0 to 23)"
        padded
        onCommit={(hour) => change({ hour })}
      />
      <span className={styles.editorDim}>:</span>
      <NumberField
        value={fields.minute}
        min={0}
        max={59}
        width={42}
        title="Minute"
        padded
        onCommit={(minute) => change({ minute })}
      />
    </span>
  );
}

// A length of history as days, hours and minutes
export function DurationInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (days: number) => void;
}) {
  const fields = durationFields(value);
  const change = (patch: Partial<DurationFields>) => {
    const next = fromDurationFields({ ...fields, ...patch });
    if (next !== value) onCommit(next);
  };

  return (
    <span className={styles.field}>
      <span className={styles.editorLabel}>{label}</span>
      <NumberField
        value={fields.days}
        min={0}
        width={52}
        title="Days"
        onCommit={(days) => change({ days })}
      />
      <span className={styles.editorDim}>d</span>
      <NumberField
        value={fields.hours}
        min={0}
        width={42}
        title="Hours"
        onCommit={(hours) => change({ hours })}
      />
      <span className={styles.editorDim}>h</span>
      <NumberField
        value={fields.minutes}
        min={0}
        width={42}
        title="Minutes"
        onCommit={(minutes) => change({ minutes })}
      />
      <span className={styles.editorDim}>m</span>
    </span>
  );
}
