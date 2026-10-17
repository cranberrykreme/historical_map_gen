import { StateCreator } from "zustand";
import { Battle, MAP_SCENE, TerrainFeature } from "../../types";
import { minPoints, newTerrainId } from "../../utils/terrain";
import { applyTerrainEdit, isEmptyEdit } from "../../utils/terrainBrush";
import {
  allScenes,
  BATTLE_SIZES,
  DEFAULT_BATTLE_KIND,
  newBattleId,
  nextBattleName,
  openScene,
} from "../../utils/scenes";
import { withHistory } from "./history";
import { MapStore, ScenesSlice } from "./types";

// Nothing selected or being dragged: what the editor needs when the scene underneath changes
const CLEAR_SELECTION = {
  selectedUnitIds: new Set<string>(),
  selectedPathId: null,
  selectedArmyId: null,
  dragPosition: null,
  dragRotation: null,
  dragScale: null,
  groupDragDelta: null,
  groupRotateDelta: null,
  groupScaleDelta: null,
};

export const createScenesSlice: StateCreator<MapStore, [], [], ScenesSlice> = (
  set,
  get
) => ({
  battles: [],
  activeSceneId: MAP_SCENE,
  sceneStash: {},

  // Loading: the battles and what's in them, with the main map being edited
  setBattles: (battles, contents) =>
    set({ battles, sceneStash: contents, activeSceneId: MAP_SCENE }),

  addBattle: (spec = {}) => {
    const state = get();
    const size = BATTLE_SIZES[0];
    const battle: Battle = {
      id: newBattleId(),
      name: spec.name?.trim() || nextBattleName(state.battles),
      kind: spec.kind ?? DEFAULT_BATTLE_KIND,
      width: spec.width ?? size.width,
      height: spec.height ?? size.height,
    };
    set({ ...withHistory(state), battles: [...state.battles, battle] });
    return battle.id;
  },

  updateBattle: (id, patch) => {
    const state = get();
    const battle = state.battles.find((b) => b.id === id);
    if (!battle) return;
    const next: Battle = {
      ...battle,
      ...patch,
      name:
        patch.name !== undefined
          ? patch.name.trim() || battle.name
          : battle.name,
    };
    if (
      next.name === battle.name &&
      next.kind === battle.kind &&
      next.width === battle.width &&
      next.height === battle.height
    )
      return;
    set({
      ...withHistory(state),
      battles: state.battles.map((b) => (b.id === id ? next : b)),
    });
  },

  // Deletes the battle and everything placed in it. Leaving it first if it's the one open.
  deleteBattle: (id) => {
    if (get().activeSceneId === id) get().switchScene(MAP_SCENE);
    const state = get();
    if (!state.battles.some((b) => b.id === id)) return;
    const { [id]: _gone, ...stash } = state.sceneStash;
    set({
      ...withHistory(state),
      battles: state.battles.filter((b) => b.id !== id),
      sceneStash: stash,
      // Shots that filmed the battle go back to the main map, dropping views and armies
      // that only made sense on the battlefield
      shots: state.shots.map((shot) => {
        if (shot.scene !== id) return shot;
        const {
          scene: _scene,
          startView: _start,
          endView: _end,
          follow: _follow,
          followOn: _followOn,
          ...rest
        } = shot;
        return rest;
      }),
    });
  },

  // Puts the scene being edited away and opens another. Not an undo step: undo works within
  // whichever scene is open (see history).
  switchScene: (sceneId) => {
    const state = get();
    if (sceneId === state.activeSceneId) return;
    if (sceneId !== MAP_SCENE && !state.battles.some((b) => b.id === sceneId))
      return;
    const { content, stash } = openScene(allScenes(state), sceneId);
    set({
      activeSceneId: sceneId,
      sceneStash: stash,
      placedUnits: content.units,
      paths: content.paths,
      armies: content.armies,
      ...CLEAR_SELECTION,
    });
  },

  addTerrain: (battleId, kind, points) => {
    const state = get();
    const battle = state.battles.find((b) => b.id === battleId);
    if (!battle || points.length < minPoints(kind)) return null;
    const feature: TerrainFeature = {
      id: newTerrainId(),
      kind,
      points: points.map(({ x, y }) => ({ x, y })),
    };
    set({
      ...withHistory(state),
      battles: state.battles.map((b) =>
        b.id === battleId
          ? { ...b, terrain: [...(b.terrain ?? []), feature] }
          : b
      ),
    });
    return feature.id;
  },

  updateTerrain: (battleId, featureId, patch) => {
    const state = get();
    const battle = state.battles.find((b) => b.id === battleId);
    const feature = battle?.terrain?.find((f) => f.id === featureId);
    if (!battle || !feature) return;
    const next = { ...feature, ...patch };
    if (next.points.length < minPoints(next.kind)) return;
    set({
      ...withHistory(state),
      battles: state.battles.map((b) =>
        b.id === battleId
          ? {
              ...b,
              terrain: (b.terrain ?? []).map((f) =>
                f.id === featureId ? next : f
              ),
            }
          : b
      ),
    });
  },

  deleteTerrain: (battleId, featureId) => {
    const state = get();
    const battle = state.battles.find((b) => b.id === battleId);
    if (!battle?.terrain?.some((f) => f.id === featureId)) return;
    set({
      ...withHistory(state),
      battles: state.battles.map((b) =>
        b.id === battleId
          ? {
              ...b,
              terrain: (b.terrain ?? []).filter((f) => f.id !== featureId),
            }
          : b
      ),
    });
  },

  // A brush or eraser stroke: any number of features added, reshaped and taken away, as one
  // undo step. A stroke that changed nothing isn't one.
  editTerrain: (battleId, edit) => {
    const state = get();
    const battle = state.battles.find((b) => b.id === battleId);
    if (!battle || isEmptyEdit(edit)) return;
    set({
      ...withHistory(state),
      battles: state.battles.map((b) =>
        b.id === battleId
          ? { ...b, terrain: applyTerrainEdit(b.terrain ?? [], edit) }
          : b
      ),
    });
  },

  sceneContents: () => allScenes(get()),

  // Runs an edit in every scene in turn (asset clean-ups, which must reach units in battles
  // too), then comes back to the scene that was open
  inEveryScene: (edit) => {
    const start = get().activeSceneId;
    const ids = [MAP_SCENE, ...get().battles.map((b) => b.id)];
    for (const id of ids) {
      get().switchScene(id);
      edit();
    }
    get().switchScene(start);
  },
});
