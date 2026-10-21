// How units go when they leave: deaths and other leaving animations, and the markers left
// where they fell. A unit leaves at its `leaves` moment in history; its `exit` says how.
//
// The animation runs in seconds of video, not history, so a death always reads the same on
// screen however fast the shot is moving through time. It starts when the video reaches the
// moment the unit leaves (see videoExitAge). Everything here is shared by the editor and the
// video renderer, so both show a death exactly alike.
//
// The code is split by topic into the files below; this re-exports all of it.

export * from "./exitStyles";
export * from "./exitTiming";
export * from "./leaving";
export * from "./markers";
export * from "./exitFrame";
