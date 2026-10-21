import { DateStyle } from "./drawFrame";
import styles from "../components/map/DateDisplay.module.css";

const px = (value: string, fallback: number) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
};

// The editor's date box as the video draws it: the same font, colours, border and spacing,
// read from the date's own stylesheet so the two always match. Sizes are kept in pixels, so the
// date is as big in the 1080-pixel frame as it is on a 1080-pixel screen.
export function readDateStyle(): DateStyle {
  const probe = document.createElement("div");
  probe.className = styles.date;
  probe.textContent = "1066";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const css = window.getComputedStyle(probe);
  const fontSize = px(css.fontSize, 28);
  const style: DateStyle = {
    font: `${css.fontStyle || "normal"} ${css.fontWeight || "400"} ${fontSize}px ${
      css.fontFamily || "serif"
    }`,
    fontSize,
    letterSpacing:
      css.letterSpacing === "normal" ? 0 : px(css.letterSpacing, 0),
    color: css.color || "#c8a84b",
    background: css.backgroundColor || "rgba(26, 18, 37, 0.8)",
    border: css.borderTopColor || "#8a7434",
    radius: px(css.borderTopLeftRadius, 8),
    padX: px(css.paddingLeft, 24),
    padY: px(css.paddingTop, 8),
    margin: px(css.top, 16),
  };
  probe.remove();
  return style;
}
