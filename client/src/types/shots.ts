// Shots: the video, cut into pieces that each show a stretch of history

// A moment on the video paired with a moment in history. Kept from the date markers of
// older projects, which become their first shots.
export interface PacingKey {
  seconds: number;
  time: number;
}

// A stretch of the video showing a stretch of history. Shots play one after another, so the
// story can jump back and forth in time. Over its `seconds`, history runs from `from` to `to`
// (days since 1 January 1970, see utils/history/historyTime); a shot whose `from` and `to` are the
// same holds that moment, for a title or a pause.
export interface Shot {
  id: string;
  name: string;
  seconds: number;
  from: number;
  to: number;
  ease?: boolean; // eases in and out rather than running at a steady rate
  hideDate?: boolean; // hides the on-screen date while this shot is on screen
  // Where the camera is as the shot starts and ends (see utils/video/camera). A shot with no start
  // view carries on from where the camera was; one with no end view holds its start view.
  startView?: CameraView;
  endView?: CameraView;
  // Starts wherever the shot before it ends, so a run of shots is one continuous move. The
  // start view is kept but not used while this is on.
  followOn?: boolean;
  // How the video goes from the shot before into this one. Missing means a cut.
  transition?: ShotTransition;
  // On the last shot: the video fades to black over its final `fadeOut` seconds. Kept but
  // not used while the shot isn't last.
  fadeOut?: number;
  // The army the camera follows through this shot (its id). The shot's views still set the
  // zoom; the army sets where the camera points.
  follow?: string;
  // The battle this shot shows (its id), with that battle's ground, units and camera. Missing
  // means the main map.
  scene?: string;
  // Starts a chapter of the video with this name: this shot and the ones after it, up to the
  // next shot that starts one (see utils/video/chapters)
  chapter?: string;
}

// What the camera sees: the map point at the centre of the video frame, and how many map
// units the frame shows from top to bottom. Measured against the frame rather than the
// window, so a view looks the same on any screen and in the rendered video.
export interface CameraView {
  centerX: number;
  centerY: number;
  height: number;
}

// The video's shape: landscape (16:9) for YouTube, portrait (9:16) for shorts
export type VideoFrame = "landscape" | "portrait";

// How one shot gives way to the next. "fade" dips to black and back, "dissolve" blends one
// picture into the other, "wipe" slides the new picture in over the old.
export type TransitionKind = "cut" | "fade" | "dissolve" | "wipe";

// The way a wipe travels: "left" means the new picture comes in from the right and moves left
export type WipeDirection = "left" | "right" | "up" | "down";

// A transition sits across the cut, half in each shot, so it never changes the video's length.
// Into the very first shot it comes in from black at the start of the video.
export interface ShotTransition {
  kind: TransitionKind;
  seconds: number;
  direction?: WipeDirection; // wipes only; left when missing
}

// How the date reads: "October 1066", "14 October 1066", or with the time of day too
export type HistoryDisplay = "months" | "days" | "times";
