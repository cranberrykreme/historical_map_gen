import { AssetType, LibrarySection } from "../../types";

// Where dropped or picked files go. A Library section that holds pictures takes them
// straight in; anywhere else (the map, the Tools section) asks what they are.
export function uploadTargetFor(
  section: LibrarySection | string | null | undefined
): AssetType | null {
  if (section === "maps" || section === "units" || section === "portraits")
    return section;
  return null;
}

const NAMES: Record<AssetType, [string, string]> = {
  units: ["unit picture", "unit pictures"],
  portraits: ["portrait", "portraits"],
  maps: ["map", "maps"],
};

// "3 portraits added", "1 map added"
export function uploadedMessage(count: number, type: AssetType): string {
  const [one, many] = NAMES[type];
  return `${count} ${count === 1 ? one : many} added`;
}

// The uploaded files that are new to the Library (not replacing a picture with the same
// name). Only these are taken away again by Undo or Change type.
export function newlyAdded(existing: string[], uploaded: string[]): string[] {
  const before = new Set(existing);
  return uploaded.filter((path) => !before.has(path));
}
