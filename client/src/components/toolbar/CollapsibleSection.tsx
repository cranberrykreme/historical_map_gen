import React, { useEffect, useState } from "react";
import { useAssetStore } from "../../store/useAssetStore";
import headerStyles from "./AssetSection.module.css";
import styles from "./PathsPanel.module.css";

const TITLE: React.CSSProperties = {
  minWidth: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// Whether a section is folded away, remembered per project in this browser
const readCollapsed = (key: string): boolean => {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};
const writeCollapsed = (key: string, collapsed: boolean) => {
  try {
    if (collapsed) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {
    // localStorage can fail (private browsing, quota); the section just won't remember
  }
};

// The look of a subsection inside a section: a quieter title, and its contents set in under a
// faint line so it's plain which section they belong to
const SUB_HEADER: React.CSSProperties = {
  textTransform: "none",
  letterSpacing: 0,
  color: "var(--color-text-secondary)",
};
const SUB_BODY: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
  marginLeft: "var(--space-sm)",
  paddingLeft: "var(--space-sm)",
  borderLeft: "1px solid var(--color-border)",
};
const BODY: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-xs)",
};

// A toolbar section with a clear title that folds away when the title is clicked; `sub` makes
// it a subsection inside another. `id` names it for remembering whether it's folded, so give
// each section its own.
function CollapsibleSection({
  id,
  title,
  sub = false,
  children,
}: {
  id: string;
  title: React.ReactNode;
  sub?: boolean;
  children: React.ReactNode;
}) {
  const projectName = useAssetStore((state) => state.currentProjectName);
  const key = `${projectName}-section-${id}`;
  const [collapsed, setCollapsed] = useState(() => readCollapsed(key));
  useEffect(() => setCollapsed(readCollapsed(key)), [key]);

  const toggle = () => {
    writeCollapsed(key, !collapsed);
    setCollapsed(!collapsed);
  };

  return (
    <div className={styles.section}>
      <div
        className={headerStyles.header}
        style={sub ? SUB_HEADER : undefined}
        onClick={toggle}
        title={collapsed ? "Show this section" : "Fold this section away"}
      >
        <span style={TITLE}>{title}</span>
        <span
          className={`${headerStyles.chevron} ${collapsed ? headerStyles.chevronCollapsed : ""}`}
        >
          ▾
        </span>
      </div>
      {!collapsed && <div style={sub ? SUB_BODY : BODY}>{children}</div>}
    </div>
  );
}

export default CollapsibleSection;
