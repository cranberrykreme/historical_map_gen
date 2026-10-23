import { PACES, paceIndex } from "./paces";

describe("paceIndex", () => {
  it("finds the pace in use", () => {
    PACES.forEach(({ days }, index) => expect(paceIndex(days)).toBe(index));
  });

  it("picks the nearest pace for one that isn't offered", () => {
    expect(PACES[paceIndex(1.2)].label).toBe("1 day");
    expect(PACES[paceIndex(300)].label).toBe("1 yr");
  });
});
