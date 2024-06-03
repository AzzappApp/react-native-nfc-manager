import { createContext, useContext } from 'react';
import type { CoverEditorAction } from './coverEditorActions';
import type {
  CoverEditorOverlayItem,
  CoverEditorState,
  MediaInfo,
} from './coverEditorTypes';

export type CoverEditorContextType = {
  coverEditorState: CoverEditorState;
  dispatch: React.Dispatch<CoverEditorAction>;
};

const CoverEditorContext = createContext<CoverEditorContextType | null>(null);

export type CoverEditorContextProviderProps = {
  value: CoverEditorContextType;
  children: React.ReactNode;
};

const CoverEditorContextProvider = ({
  value,
  children,
}: CoverEditorContextProviderProps) => {
  return (
    <CoverEditorContext.Provider value={value}>
      {children}
    </CoverEditorContext.Provider>
  );
};

export default CoverEditorContextProvider;

export const useCoverEditorContext = () => {
  const context = useContext(CoverEditorContext);
  if (context === null) {
    throw new Error('Using CoverEditorContext without provider');
  }

  return context;
};

export const useCoverEditorOverlayLayer = () => {
  const { coverEditorState } = useCoverEditorContext();

  if (
    coverEditorState.overlayLayer == null ||
    coverEditorState.layerMode !== 'overlay'
  ) {
    //returning null (when not selected), will reduce the number of bottom sheet/screen modal etc in memory
    return null;
  }
  return coverEditorState.overlayLayer!;
};

export const useCoverEditorTextLayer = () => {
  const { coverEditorState } = useCoverEditorContext();

  if (
    coverEditorState.layerMode !== 'text' ||
    coverEditorState.selectedLayerIndex == null
  ) {
    return null;
  }
  return coverEditorState.textLayers[coverEditorState.selectedLayerIndex];
};

export const useCoverEditorLinksLayer = () => {
  const { coverEditorState } = useCoverEditorContext();

  if (coverEditorState.layerMode !== 'links') {
    return null;
  }
  return coverEditorState.linksLayer;
};

export const useCoverEditorMedia = () => {
  const { coverEditorState } = useCoverEditorContext();

  if (
    coverEditorState.layerMode !== 'mediaEdit' ||
    coverEditorState.selectedLayerIndex == null
  ) {
    return null;
  }
  return coverEditorState.medias[coverEditorState.selectedLayerIndex];
};

export const useCoverEditorActiveMedia: () =>
  | CoverEditorOverlayItem
  | MediaInfo
  | null = () => {
  const { coverEditorState } = useCoverEditorContext();
  if (
    coverEditorState.layerMode === 'overlay' &&
    coverEditorState.overlayLayer
  ) {
    return coverEditorState.overlayLayer;
  } else if (
    coverEditorState.layerMode === 'mediaEdit' &&
    coverEditorState.selectedLayerIndex != null
  ) {
    return coverEditorState.medias[coverEditorState.selectedLayerIndex];
  }
  return null;
};
