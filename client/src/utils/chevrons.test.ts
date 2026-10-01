import { chevronsAlong } from "./pathGeometry";

const straight = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
];

test("chevrons are spread evenly along the path, away from the ends", () => {
  const chevrons = chevronsAlong(straight, 30);
  expect(chevrons).toHaveLength(3);
  expect(chevrons[0].x).toBeCloseTo(100 / 6, 3);
  expect(chevrons[1].x).toBeCloseTo(50, 3);
  expect(chevrons[2].x).toBeCloseTo(500 / 6, 3);
  chevrons.forEach((chevron) => expect(chevron.heading).toBeCloseTo(0, 5));
});

test("a path shorter than the spacing still gets one chevron in the middle", () => {
  const chevrons = chevronsAlong(straight, 500);
  expect(chevrons).toHaveLength(1);
  expect(chevrons[0].x).toBeCloseTo(50, 3);
});

test("the number of chevrons is capped", () => {
  const long = [
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
  ];
  expect(chevronsAlong(long, 1, 10)).toHaveLength(10);
});

test("there are no chevrons without a curve", () => {
  expect(chevronsAlong([{ x: 0, y: 0 }], 10)).toEqual([]);
});
