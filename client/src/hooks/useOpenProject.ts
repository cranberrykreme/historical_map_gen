import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ViewportApi } from "../types";
import { useMapStore } from "../store/useMapStore";
import { useAssetStore } from "../store/useAssetStore";
import { useTimelineStore } from "../store/useTimelineStore";
import useProject from "./useProject";

// Opens a project in the editor: clears the last project away, fetches this one's pictures,
// then loads its saved file into the stores and puts the map view back where it was saved
function useOpenProject(
  projectName: string | undefined,
  loadProject: ReturnType<typeof useProject>["loadProject"],
  viewportApiRef: React.RefObject<ViewportApi | null>,
  // Autosave stops before the last project is cleared away, and starts once this one is in
  onUnloading: () => void,
  onLoaded: () => void
) {
  const navigate = useNavigate();
  const setCurrentProject = useAssetStore((state) => state.setCurrentProject);
  const fetchAssetList = useAssetStore((state) => state.fetchAssetList);
  const resetMapState = useMapStore((state) => state.resetMapState);
  const setPlacedUnits = useMapStore((state) => state.setPlacedUnits);
  const setPaths = useMapStore((state) => state.setPaths);
  const setArmies = useMapStore((state) => state.setArmies);
  const setStoryStart = useMapStore((state) => state.setStoryStart);
  const setDisplayMode = useMapStore((state) => state.setDisplayMode);
  const setPacing = useMapStore((state) => state.setPacing);
  const setShots = useMapStore((state) => state.setShots);
  const setVideoFrame = useMapStore((state) => state.setVideoFrame);
  const setSavedViewport = useMapStore((state) => state.setSavedViewport);
  const setBattles = useMapStore((state) => state.setBattles);
  const setSelectedMap = useMapStore((state) => state.setSelectedMap);

  useEffect(() => {
    if (!projectName) {
      navigate("/");
      return;
    }
    onUnloading();
    resetMapState();
    useTimelineStore.getState().reset();
    setCurrentProject(projectName);
    fetchAssetList("units");
    fetchAssetList("portraits");
    fetchAssetList("maps");
  }, [
    projectName,
    fetchAssetList,
    navigate,
    setCurrentProject,
    resetMapState,
    onUnloading,
  ]);

  useEffect(() => {
    loadProject().then(
      ({
        units,
        paths: loadedPaths,
        armies,
        storyStart,
        displayMode,
        pacing,
        shots,
        videoFrame,
        selectedMapFilename: loadedMap,
        viewport,
        battles,
      }) => {
        setStoryStart(storyStart);
        setDisplayMode(displayMode);
        setPacing(pacing);
        setShots(shots);
        setVideoFrame(videoFrame);
        if (units.length > 0) {
          setPlacedUnits(units);
        }
        if (loadedPaths.length > 0) {
          setPaths(loadedPaths);
        }
        setArmies(armies);
        // Each battle's units, paths and armies wait in the stash until it's opened
        setBattles(
          battles.map(({ units, paths, armies, ...battle }) => battle),
          Object.fromEntries(
            battles.map(({ id, units, paths, armies }) => [
              id,
              { units, paths, armies },
            ])
          )
        );
        if (loadedMap) {
          setSelectedMap(loadedMap);
        }
        setSavedViewport(viewport);
        if (viewport) {
          viewportApiRef.current?.apply(viewport);
        }
        onLoaded();
      }
    );
  }, [
    loadProject,
    viewportApiRef,
    setPlacedUnits,
    setPaths,
    setArmies,
    setStoryStart,
    setDisplayMode,
    setPacing,
    setShots,
    setVideoFrame,
    setSavedViewport,
    setSelectedMap,
    setBattles,
    onLoaded,
  ]);
}

export default useOpenProject;
