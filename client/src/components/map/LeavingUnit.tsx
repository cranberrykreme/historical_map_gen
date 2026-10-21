import React from "react";
import API_BASE_URL from "../../config/api";
import { Unit } from "../../types";
import { blockBox } from "../../utils/units/blocks";
import { ExitFrame, UNIT_IMAGE_WIDTH } from "../../utils/units/exits";
import BlockShape from "./BlockShape";
import ExitPieces from "../exits/ExitPieces";
import { UNIT_TILT } from "./unitLook";

// A unit part way through leaving (dying), drawn in pieces under the rest. It can't be
// selected or moved.
function LeavingUnit({
  unit,
  frame,
  projectName,
}: {
  unit: Unit;
  frame: ExitFrame;
  projectName: string | null;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate(${unit.x}px, ${unit.y}px) translate(-50%, -50%) rotate(${unit.rotation + UNIT_TILT}deg) scale(${unit.scale})`,
        transformOrigin: "center center",
        pointerEvents: "none",
      }}
    >
      <ExitPieces
        frame={frame}
        width={unit.block ? blockBox(unit.block).width : UNIT_IMAGE_WIDTH}
      >
        {unit.block ? (
          <BlockShape block={unit.block} rotation={unit.rotation} />
        ) : (
          <img
            src={`${API_BASE_URL}/api/projects/${projectName}/assets/${unit.assetType}/${unit.path ?? unit.filename}`}
            alt=""
            draggable={false}
            style={{
              width: `${UNIT_IMAGE_WIDTH}px`,
              height: "auto",
              display: "block",
              userSelect: "none",
              transform: unit.flipped ? "scaleX(-1)" : undefined,
            }}
          />
        )}
      </ExitPieces>
    </div>
  );
}

export default LeavingUnit;
