import { newlyAdded, uploadedMessage, uploadTargetFor } from "./uploads";

describe("uploadTargetFor", () => {
  it("sends files to the Library section they were dropped on", () => {
    expect(uploadTargetFor("maps")).toBe("maps");
    expect(uploadTargetFor("units")).toBe("units");
    expect(uploadTargetFor("portraits")).toBe("portraits");
  });

  it("asks when the place is unclear", () => {
    expect(uploadTargetFor("tools")).toBeNull();
    expect(uploadTargetFor(null)).toBeNull();
    expect(uploadTargetFor(undefined)).toBeNull();
  });
});

describe("uploadedMessage", () => {
  it("names how many and what", () => {
    expect(uploadedMessage(3, "portraits")).toBe("3 portraits added");
    expect(uploadedMessage(1, "maps")).toBe("1 map added");
    expect(uploadedMessage(2, "units")).toBe("2 unit pictures added");
  });
});

describe("newlyAdded", () => {
  it("leaves out files that replaced one of the same name", () => {
    expect(newlyAdded(["a.png", "b.png"], ["b.png", "c.png"])).toEqual([
      "c.png",
    ]);
  });
});
