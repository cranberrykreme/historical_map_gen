import { scaledDateStyle } from "./dateStyle";

test("a smaller frame's date box shrinks every size by the same factor", () => {
  const style = {
    font: 'normal 400 28px "Cinzel"',
    fontSize: 28,
    letterSpacing: 2,
    color: "gold",
    background: "black",
    border: "gold",
    radius: 8,
    padX: 24,
    padY: 8,
    margin: 16,
  };
  expect(scaledDateStyle(style, 0.5)).toEqual({
    ...style,
    font: 'normal 400 14px "Cinzel"',
    fontSize: 14,
    letterSpacing: 1,
    radius: 4,
    padX: 12,
    padY: 4,
    margin: 8,
  });
});
