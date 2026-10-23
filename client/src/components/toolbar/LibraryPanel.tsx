import React from "react";
import ToolbarButton from "./ToolbarButton";
import AssetSection from "./AssetSection";
import MapSection from "./MapSection";
import PsdPanel from "./PsdPanel";
import PortraitPanel from "./PortraitPanel";
import CollapsibleSection from "./CollapsibleSection";
import BlocksSection from "../blocks/BlocksSection";
import { AssetType, LibrarySection } from "../../types";
import { useAssetStore } from "../../store/useAssetStore";
import { useSidePanelStore } from "../../store/useSidePanelStore";
import { uploadTargetFor } from "../../utils/project/uploads";
import assetStyles from "./AssetsPanel.module.css";
import styles from "./PathsPanel.module.css";

interface LibraryPanelProps {
  // Opens the file picker; files go straight to the given section, or null asks
  onAddAsset: (type: AssetType | null) => void;
  selectedMapFilename: string | null;
  onSelectMap: (filename: string | null) => void;
  onDeleteAsset: (path: string, assetType: AssetType) => void;
  onAssetRenamed: (
    oldPath: string,
    newPath: string,
    assetType: AssetType
  ) => void;
  onSelectPsd: (name: string) => void;
  onSelectPortraitSource: (filename: string) => void;
}

const SECTIONS: { id: LibrarySection; label: string; hint: string }[] = [
  { id: "maps", label: "Maps", hint: "Map pictures for the main map" },
  {
    id: "units",
    label: "Units",
    hint: "Unit pictures and formation blocks",
  },
  { id: "portraits", label: "Portraits", hint: "Portraits of people" },
  {
    id: "tools",
    label: "Tools",
    hint: "The PSD editor and the portrait maker",
  },
];

const SEGMENT: React.CSSProperties = { flexShrink: 0 };

// Everything the project is made from, one section at a time: map pictures, units (with the
// formation blocks), portraits, and the tools that make them (the PSD editor and portrait
// maker). Files are added with the button at the top or by dropping them on the map.
function LibraryPanel({
  onAddAsset,
  selectedMapFilename,
  onSelectMap,
  onDeleteAsset,
  onAssetRenamed,
  onSelectPsd,
  onSelectPortraitSource,
}: LibraryPanelProps) {
  const section = useSidePanelStore((state) => state.librarySection);
  const setSection = useSidePanelStore((state) => state.setLibrarySection);
  const units = useAssetStore((state) => state.units);
  const portraits = useAssetStore((state) => state.portraits);
  const maps = useAssetStore((state) => state.maps);
  const createFolder = useAssetStore((state) => state.createFolder);
  const renameOrMoveAsset = useAssetStore((state) => state.renameOrMoveAsset);

  const assetSection = (
    type: "units" | "portraits",
    title: string,
    files: typeof units
  ) => (
    <AssetSection
      title={title}
      assetType={type}
      files={files.files}
      folders={files.folders}
      onDeleteAsset={onDeleteAsset}
      onCreateFolder={(name) => createFolder(type, name)}
      onMoveAsset={(path, folder) =>
        renameOrMoveAsset(path, type, { folder }, onAssetRenamed)
      }
      onRenameAsset={(path, filename, folder) =>
        renameOrMoveAsset(
          path,
          type,
          { filename, folder: folder ?? "" },
          onAssetRenamed
        )
      }
    />
  );

  const empty = (what: string) => (
    <p className={styles.emptyMessage}>
      No {what} yet. Click the Add button above, or drop files here.
    </p>
  );

  return (
    // Files dropped anywhere on the panel go straight into the section on show
    <div className={styles.panel} data-library-section={section}>
      <div className={styles.segment} style={SEGMENT}>
        {SECTIONS.map(({ id, label, hint }) => (
          <button
            key={id}
            title={hint}
            className={`${styles.segmentButton} ${section === id ? styles.segmentActive : ""}`}
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {section !== "tools" && (
        <ToolbarButton
          icon="+"
          label={`Add ${SECTIONS.find((s) => s.id === section)?.label.toLowerCase()}`}
          hint="Add pictures to this part of the Library (or drop files here)"
          onClick={() => onAddAsset(uploadTargetFor(section))}
          isExpanded={true}
        />
      )}

      <div className={assetStyles.sectionList}>
        {section === "maps" &&
          (maps.files.length === 0 ? (
            empty("maps")
          ) : (
            <MapSection
              maps={maps.files}
              selectedMapFilename={selectedMapFilename}
              onSelectMap={onSelectMap}
              onDeleteAsset={onDeleteAsset}
            />
          ))}
        {section === "units" && (
          <>
            {units.files.length === 0 && units.folders.length === 0
              ? empty("unit pictures")
              : assetSection("units", "Units", units)}
            <BlocksSection />
          </>
        )}
        {section === "portraits" &&
          (portraits.files.length === 0 && portraits.folders.length === 0
            ? empty("portraits")
            : assetSection("portraits", "Portraits", portraits))}
        {section === "tools" && (
          <>
            <CollapsibleSection id="tool-psd" title="PSD editor">
              <PsdPanel onSelectPsd={onSelectPsd} />
            </CollapsibleSection>
            <CollapsibleSection id="tool-portrait" title="Portrait maker">
              <PortraitPanel onSelectSource={onSelectPortraitSource} />
            </CollapsibleSection>
          </>
        )}
      </div>
    </div>
  );
}

export default LibraryPanel;
