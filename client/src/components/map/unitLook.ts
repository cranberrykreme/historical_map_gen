// How units look on the map in the editor

// Every unit is turned a hundredth of a degree more than its own rotation. Firefox snaps
// pictures that sit square to the screen to whole pixels, so while the map zooms they jumped
// a pixel back and forth against the map underneath; a turned picture isn't snapped. The
// turn itself is far too small to see.
export const UNIT_TILT = 0.01;

export const GOLD = "#c8a84b";
