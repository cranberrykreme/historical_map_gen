import { PROJECT_VERSION } from "../../types";
import { parseProject } from "./convertProject";

const unit = (id: string) => ({
  id,
  filename: `${id}.png`,
  path: `units/${id}.png`,
  assetType: "units",
  x: 1,
  y: 2,
  rotation: 0,
  scale: 1,
});

test("a project without battles loads with none", () => {
  expect(parseProject({ version: PROJECT_VERSION, units: [] }).battles).toEqual(
    []
  );
  expect(parseProject({ units: [] }).battles).toEqual([]);
});

test("each battle loads with its own units, paths and armies", () => {
  const project = parseProject({
    version: PROJECT_VERSION,
    units: [unit("map")],
    battles: [
      {
        id: "b1",
        name: "Hastings",
        kind: "land",
        width: 2400,
        height: 1500,
        units: [unit("saxon"), unit("norman")],
        paths: [],
        armies: [
          { id: "army", name: "Harold", members: [{ unitId: "saxon" }] },
        ],
      },
    ],
  });
  expect(project.units.map((u) => u.id)).toEqual(["map"]);
  expect(project.battles).toHaveLength(1);
  const [battle] = project.battles;
  expect(battle).toMatchObject({
    id: "b1",
    name: "Hastings",
    kind: "land",
    width: 2400,
    height: 1500,
  });
  expect(battle.units.map((u) => u.id)).toEqual(["saxon", "norman"]);
  expect(battle.armies.map((a) => a.name)).toEqual(["Harold"]);
});

test("broken or repeated battles are skipped, and missing parts start empty", () => {
  const project = parseProject({
    version: PROJECT_VERSION,
    battles: [{ id: "b1" }, { id: "b1" }, null, { name: "no id" }],
  });
  expect(project.battles).toHaveLength(1);
  expect(project.battles[0]).toMatchObject({
    units: [],
    paths: [],
    armies: [],
  });
});

test("a battle's terrain loads with it", () => {
  const project = parseProject({
    version: PROJECT_VERSION,
    battles: [
      {
        id: "b1",
        terrain: [
          {
            id: "t1",
            kind: "hill",
            points: [
              { x: 0, y: 0 },
              { x: 10, y: 0 },
              { x: 5, y: 10 },
            ],
          },
        ],
      },
    ],
  });
  expect(project.battles[0].terrain).toHaveLength(1);
  expect(project.battles[0].terrain![0].kind).toBe("hill");
});
