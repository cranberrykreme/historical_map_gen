import React from "react";
import { PALETTE } from "../../constants/palette";
import { RgbColor } from "../../types";
import styles from "./PsdColorPalette.module.css";

interface PsdColorPaletteProps {
  appliedId: string | null;
  disabled: boolean;
  onPick: (id: string) => void;
}

const css = (c: RgbColor) => `rgb(${c.r}, ${c.g}, ${c.b})`;

function PsdColorPalette({
  appliedId,
  disabled,
  onPick,
}: PsdColorPaletteProps) {
  return (
    <div className={styles.palette}>
      <div className={styles.grid}>
        {PALETTE.map((colour) => (
          <button
            key={colour.id}
            title={colour.label}
            disabled={disabled}
            onClick={() => onPick(colour.id)}
            className={`${styles.swatch} ${appliedId === colour.id ? styles.swatchActive : ""}`}
            style={{
              background: css(colour.fill),
              borderColor: css(colour.stroke),
            }}
          />
        ))}
      </div>
      {disabled && (
        <p className={styles.hint}>
          Set both the interior and border colours to enable recolouring.
        </p>
      )}
    </div>
  );
}

export default PsdColorPalette;
