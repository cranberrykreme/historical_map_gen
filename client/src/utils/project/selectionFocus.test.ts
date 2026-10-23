import { nextFocus, SelectionState, sharedValue } from "./selectionFocus";

const none: SelectionState = {
  unitIds: new Set(),
  pathId: null,
  shotId: null,
  terrainId: null,
};

describe("nextFocus", () => {
  it("shows whatever was selected last", () => {
    const units = { ...none, unitIds: new Set(["a"]) };
    expect(nextFocus(null, none, units)).toBe("units");
    const andMarch = { ...units, pathId: "p" };
    expect(nextFocus("units", units, andMarch)).toBe("march");
    const andMore = { ...andMarch, unitIds: new Set(["a", "b"]) };
    expect(nextFocus("march", andMarch, andMore)).toBe("units");
  });

  it("falls back to what is still selected when the shown thing is deselected", () => {
    const both = { ...none, unitIds: new Set(["a"]), pathId: "p" };
    expect(nextFocus("march", both, { ...both, pathId: null })).toBe("units");
    expect(nextFocus("units", both, { ...both, unitIds: new Set() })).toBe(
      "march"
    );
  });

  it("closes when nothing is selected", () => {
    const shot = { ...none, shotId: "s" };
    expect(nextFocus("shot", shot, none)).toBeNull();
  });

  it("keeps the shown thing when something else is cleared", () => {
    const both = { ...none, shotId: "s", terrainId: "t" };
    expect(nextFocus("shot", both, { ...both, terrainId: null })).toBe("shot");
  });
});

describe("sharedValue", () => {
  it("gives the value all items share", () => {
    expect(sharedValue([{ a: 1 }, { a: 1 }], (x) => x.a)).toBe(1);
  });

  it("gives nothing for mixed values or no items", () => {
    expect(sharedValue([{ a: 1 }, { a: 2 }], (x) => x.a)).toBeUndefined();
    expect(sharedValue([] as { a: number }[], (x) => x.a)).toBeUndefined();
  });
});
