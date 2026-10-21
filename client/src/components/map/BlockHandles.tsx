import React from "react";
import { FormationBlock } from "../../types";
import { BlockHandle, blockHandles } from "../../utils/units/blocks";
import { GOLD } from "./unitLook";

// A selected formation block's handles: the sides widen it, the back deepens it, the front
// bends it
function BlockHandles({
  block,
  onHandleMouseDown,
}: {
  block: FormationBlock;
  onHandleMouseDown: (e: React.MouseEvent, handle: BlockHandle) => void;
}) {
  return (
    <>
      {(
        Object.entries(blockHandles(block)) as [
          BlockHandle,
          { x: number; y: number },
        ][]
      ).map(([handle, at]) => (
        <g key={handle}>
          <title>
            {handle === "front"
              ? "Drag to bend the block (back to the middle to straighten it)"
              : handle === "back"
                ? "Drag to make the block deeper or shallower"
                : "Drag to make the block wider or narrower"}
          </title>
          {handle === "front" ? (
            <rect
              x={at.x - 5}
              y={at.y - 5}
              width={10}
              height={10}
              transform={`rotate(45 ${at.x} ${at.y})`}
              fill={GOLD}
              stroke="#1a1225"
              strokeWidth={1}
              style={{ cursor: "ns-resize", pointerEvents: "all" }}
              onMouseDown={(e) => onHandleMouseDown(e, handle)}
            />
          ) : (
            <circle
              cx={at.x}
              cy={at.y}
              r={6}
              fill="#fff"
              stroke={GOLD}
              strokeWidth={2}
              style={{
                cursor: handle === "back" ? "ns-resize" : "ew-resize",
                pointerEvents: "all",
              }}
              onMouseDown={(e) => onHandleMouseDown(e, handle)}
            />
          )}
        </g>
      ))}
    </>
  );
}

export default BlockHandles;
