import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../../config/api";
import { useAssetStore } from "../../store/useAssetStore";
import { FrameAssets, unitImageKey } from "../../render/drawFrame";
import { DrawUnit } from "../../render/scene";

type Picture = { image: HTMLImageElement; aspect: number };

// Every unit picture the editor has loaded, by its address, kept while the app is open so
// moving between scenes or projects doesn't load them again. `null` while it's loading or if
// it couldn't be loaded.
const loaded = new Map<string, Picture | null>();
const waiting = new Map<string, Set<() => void>>();

// The same address the editor always used for a unit's picture, so the browser's copy is used
export const unitImageUrl = (
  project: string | null,
  unit: Pick<DrawUnit, "assetType" | "path">
) =>
  `${API_BASE_URL}/api/projects/${project}/assets/${unit.assetType}/${unit.path}`;

function load(url: string, done: () => void): void {
  if (loaded.get(url)) return;
  let listeners = waiting.get(url);
  if (listeners) {
    listeners.add(done);
    return;
  }
  listeners = new Set([done]);
  waiting.set(url, listeners);
  loaded.set(url, null);
  const image = new Image();
  const finish = (picture: Picture | null) => {
    loaded.set(url, picture);
    const all = waiting.get(url);
    waiting.delete(url);
    all?.forEach((listener) => listener());
  };
  image.onload = () =>
    finish(
      image.naturalWidth > 0
        ? { image, aspect: image.naturalHeight / image.naturalWidth }
        : null
    );
  image.onerror = () => finish(null);
  image.src = url;
}

// The pictures the units need, by asset type and path (see unitImageKey), as the map's drawing
// wants them. Pictures still loading are missing, and the map draws again when each arrives.
export function useUnitImages(units: DrawUnit[]): FrameAssets["unitImages"] {
  const project = useAssetStore((state) => state.currentProjectName);
  const [arrived, setArrived] = useState(0);

  // Which pictures are wanted, as a stable list so a new list of units with the same
  // pictures doesn't start anything
  const wanted = Array.from(
    new Set(
      units.filter((unit) => !unit.block).map((unit) => unitImageKey(unit))
    )
  )
    .sort()
    .join("\n");

  useEffect(() => {
    if (!wanted) return;
    let live = true;
    const done = () => {
      if (live) setArrived((n) => n + 1);
    };
    for (const key of wanted.split("\n")) {
      const slash = key.indexOf("/");
      const url = unitImageUrl(project, {
        assetType: key.slice(0, slash) as DrawUnit["assetType"],
        path: key.slice(slash + 1),
      });
      load(url, done);
    }
    return () => {
      live = false;
    };
  }, [wanted, project]);

  return useMemo(() => {
    const pictures = new Map<string, Picture>();
    if (!wanted) return pictures;
    for (const key of wanted.split("\n")) {
      const slash = key.indexOf("/");
      const picture = loaded.get(
        unitImageUrl(project, {
          assetType: key.slice(0, slash) as DrawUnit["assetType"],
          path: key.slice(slash + 1),
        })
      );
      if (picture) pictures.set(key, picture);
    }
    return pictures;
    // `arrived` counts pictures as they load, so the map is rebuilt with each new one
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, project, arrived]);
}
