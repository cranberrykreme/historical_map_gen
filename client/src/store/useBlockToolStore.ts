import { create } from "zustand";
import { FormationBlock } from "../types";
import { newBlockSpec } from "../utils/blocks";

// The formation block tool: the block the panel is setting up to place (its kind, colour,
// name and size, kept between placings so a row of blocks is quick to lay out), and whether the
// next click on the map places it. Not part of the project or of undo.
interface BlockToolStore {
  draft: FormationBlock;
  placing: boolean;
  setDraft: (patch: Partial<FormationBlock>) => void;
  startPlacing: () => void;
  stopPlacing: () => void;
}

export const useBlockToolStore = create<BlockToolStore>((set) => ({
  draft: newBlockSpec(),
  placing: false,
  // kept as typed (spaces and all) until it's placed, when it's tidied
  setDraft: (patch) =>
    set((state) => ({ draft: { ...state.draft, ...patch } })),
  startPlacing: () => set({ placing: true }),
  stopPlacing: () => set({ placing: false }),
}));
