import { Battle, BattleKind, TerrainFeature, TerrainStyle } from "../../types";
import { TerrainStroke, inPolygon, strokesSvg } from "./terrain";
import {
  styleGround,
  styleOverlay,
  stylePatterns,
  styleStrokes,
} from "./terrainStyles";
import { groundOf } from "./battleGround";
import { runLines } from "./battleLines";
import { townLayout } from "./battleTowns";
import { drawAreas } from "./battleAreas";
import { drawStreets } from "./battleStreets";
import { drawLines } from "./battleLineStrokes";

export { inPolygon };
export { outwardNormals, waterAt } from "./battleGeometry";

// How a whole battleground is drawn: every feature, and the ways they meet. All of it is
// worked out from the shapes each time, so moving a river moves its mouth, its bridges and
// the lane it cuts through a wood.
//
//  1. A river or stream running into the sea or a lake stops exactly at the shore (an island's
//     beach included) and fans out into the water.
//  2. A river's free end (its source, the end it was drawn from) narrows to a trickle.
//  3. A road crossing a river gets a bridge, and crossing a stream a ford. Walls, palisades,
//     ditches and roads stop at water.
//  4. Roads, rivers and streams clear a lane through woods and towns, ending exactly at their
//     edges; a road through a town becomes a street lined with rows of terrace houses. A big
//     town gets a market square on its main street and a church. A walled town has a wall
//     with towers round it, and a gate wherever a road comes in.
//  5. Land meeting water gets a surf line and a ring of shallows; a sea in a land battle gets
//     a beach, and a lake a clear shoreline and a damp green bank.
//  6. Overlapping areas of one kind merge into one, with no edge across the middle; lines of
//     a kind join up, and streams flow into rivers.
//  7. Hills and mountains are lit from the top left and shaded to the bottom right, over
//     whatever stands on them, ridges too; trees and houses on high ground (ridges included) are
//     drawn a little bigger (nearer the camera) and over the ones below them.
//  8. Marsh beside water gets wetter towards it, inside the marsh only.
//  9. Snow lies on everything inside a snow area: trees, roofs and rocks get snow on them,
//     roads are dusted white, lakes, seas and rivers freeze over, and peaks get big snow caps.
// 10. An area's holes (a clearing in a forest, an island in a lake) are outside it in every
//     way: nothing of it is drawn there, and its edge, shore or coast runs round them too.
//
// Trees, peaks, rocks and houses are scattered one by one (see scatterItems), each drawn whole
// or not at all: never cut by an area's edge, a road, a river or a wall.
//
// No two buildings ever overlap: each has an outline, checked against the ones already built.
//
// The work is done in stages, each in its own file: the ground (battleGround), where each
// line runs (battleLines), the towns' layout (battleTowns), then drawing the areas
// (battleAreas), the streets and walls (battleStreets) and the lines (battleLineStrokes).

export function battleStrokes(
  features: TerrainFeature[],
  ground: BattleKind,
  width: number,
  height: number
): TerrainStroke[] {
  const g = groundOf(features, ground, width, height);
  const lr = runLines(g);
  const towns = townLayout(g, lr);

  const out: TerrainStroke[] = [];
  drawAreas(g, lr, towns, out);
  drawStreets(g, lr, towns, out);
  drawLines(g, lr, out);

  const { snowAreas } = g;
  // A light dusting of snow over everything inside a snow area
  for (const cover of snowAreas)
    out.push({
      d: cover.d,
      fill: "#ffffff",
      opacity: 0.28,
      fillRule: cover.rule,
    });

  return out;
}

// Every stroke of a battleground in the battle's style (see terrainStyles): recoloured, with
// whatever the style draws on top (hachures, contours, paper grain)
export function styledBattleStrokes(
  features: TerrainFeature[],
  ground: BattleKind,
  width: number,
  height: number,
  style?: TerrainStyle
): TerrainStroke[] {
  return styleBattle(
    battleStrokes(features, ground, width, height),
    features,
    width,
    height,
    style
  );
}

// Strokes already worked out for a battleground, put in a style
export const styleBattle = (
  strokes: TerrainStroke[],
  features: TerrainFeature[],
  width: number,
  height: number,
  style?: TerrainStyle
): TerrainStroke[] =>
  !style || style === "painted"
    ? strokes
    : [
        ...styleStrokes(strokes, style),
        ...styleOverlay(features, width, height, style),
      ];

// The whole battleground as an SVG file: the ground, every feature and the ways they meet, at
// the battle's size in map units, in the battle's style. The renderer draws from this (9.6),
// so the video matches the editor.
export function terrainSvg(battle: Battle): string {
  const strokes = styledBattleStrokes(
    battle.terrain ?? [],
    battle.kind,
    battle.width,
    battle.height,
    battle.style
  );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${battle.width}" height="${battle.height}" ` +
    `viewBox="0 0 ${battle.width} ${battle.height}"><defs>${stylePatterns(battle.style)}</defs>` +
    `<rect width="${battle.width}" height="${battle.height}" fill="${styleGround(battle.kind, battle.style)}"/>` +
    `${strokesSvg(strokes)}</svg>`
  );
}
