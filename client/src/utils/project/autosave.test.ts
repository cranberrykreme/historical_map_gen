import {
  AUTOSAVE_DELAY,
  autosaveStep,
  DocumentFields,
  isDocumentEdit,
} from "./autosave";

const doc = (): DocumentFields => ({
  activeSceneId: "map",
  placedUnits: [],
  paths: [],
  armies: [],
  shots: [],
  battles: [],
  sceneStash: {},
  storyStart: 0,
  displayMode: "months",
  pacing: [],
  videoFrame: "landscape",
  selectedMapFilename: null,
});

const idle = { dragging: false, playing: false, drawing: false };

describe("isDocumentEdit", () => {
  it("counts a change to anything saved in the project", () => {
    const before = doc();
    expect(isDocumentEdit({ ...before, shots: [] }, before)).toBe(true);
    expect(isDocumentEdit({ ...before, storyStart: 5 }, before)).toBe(true);
    expect(isDocumentEdit({ ...before, videoFrame: "portrait" }, before)).toBe(
      true
    );
  });

  it("ignores changes that leave the project as it was", () => {
    const before = doc();
    expect(isDocumentEdit({ ...before }, before)).toBe(false);
  });

  it("ignores opening another scene", () => {
    const before = doc();
    expect(
      isDocumentEdit(
        {
          ...before,
          activeSceneId: "battle-1",
          placedUnits: [],
          sceneStash: {},
        },
        before
      )
    ).toBe(false);
  });
});

describe("autosaveStep", () => {
  it("does nothing with nothing to save", () => {
    expect(autosaveStep(false, 0, 10000, false, idle)).toBe("nothing");
  });

  it("waits until a moment after the last edit", () => {
    expect(
      autosaveStep(true, 1000, 1000 + AUTOSAVE_DELAY - 1, false, idle)
    ).toBe("wait");
    expect(autosaveStep(true, 1000, 1000 + AUTOSAVE_DELAY, false, idle)).toBe(
      "save"
    );
  });

  it("waits while dragging, playing, drawing or already saving", () => {
    const later = 1000 + AUTOSAVE_DELAY * 2;
    expect(
      autosaveStep(true, 1000, later, false, { ...idle, dragging: true })
    ).toBe("wait");
    expect(
      autosaveStep(true, 1000, later, false, { ...idle, playing: true })
    ).toBe("wait");
    expect(
      autosaveStep(true, 1000, later, false, { ...idle, drawing: true })
    ).toBe("wait");
    expect(autosaveStep(true, 1000, later, true, idle)).toBe("wait");
  });
});
