import React, { useEffect, useState } from "react";
import styles from "../toolbar/PathsPanel.module.css";

const INPUT: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  boxSizing: "border-box",
};

// A text box that hands over what's typed when you leave it or press Enter (one undo step);
// Escape puts back what was there
function CommitText({
  value,
  placeholder,
  title,
  onCommit,
}: {
  value: string;
  placeholder?: string;
  title?: string;
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
      title={title}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text !== value) onCommit(text);
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setText(value);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

export default CommitText;
