import { createContext, useContext } from 'react';
import type { CoverEditorAction } from './coverEditorActions';
import type {
  CoverEditorLinksLayerItem,
  CoverEditorOverlayItem,
  CoverEditorState,
  CoverEditorTextLayerItem,
  CoverMedia,
  CoverMediaImage,
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

type UseCurrentLayerReturnType =
  | { kind: 'links'; layer: CoverEditorLinksLayerItem }
  | { kind: 'media'; layer: CoverMedia }
  | { kind: 'none'; layer: null }
  | { kind: 'overlay'; layer: CoverEditorOverlayItem }
  | { kind: 'text'; layer: CoverEditorTextLayerItem };

export const useCurrentLayer = (): UseCurrentLayerReturnType => {
  const {
    coverEditorState: {
      editionMode,
      selectedItemIndex,
      overlayLayers,
      textLayers,
      medias,
      linksLayer,
    },
  } = useCoverEditorContext();

  if (selectedItemIndex == null) {
    return editionMode === 'links'
      ? { kind: 'links', layer: linksLayer }
      : { kind: 'none', layer: null };
  }
  switch (editionMode) {
    case 'overlay':
      return {
        kind: 'overlay',
        layer: overlayLayers[selectedItemIndex],
      };
    case 'text':
    case 'textEdit':
      return {
        kind: 'text',
        layer: textLayers[selectedItemIndex],
      };
    case 'mediaEdit':
      return {
        kind: 'media',
        layer: medias[selectedItemIndex],
      };
    default:
      return { kind: 'none', layer: null };
  }
};

export const useCoverEditorOverlayLayer = () => {
  const { kind, layer } = useCurrentLayer();
  return kind === 'overlay' ? layer : null;
};

export const useCoverEditorTextLayer = () => {
  const { kind, layer } = useCurrentLayer();
  return kind === 'text' ? layer : null;
};

export const useCoverEditorLinksLayer = () => {
  const { kind, layer } = useCurrentLayer();
  return kind === 'links' ? layer : null;
};

export const useCoverEditorMedia = () => {
  const { kind, layer } = useCurrentLayer();
  return kind === 'media' ? layer : null;
};

//TODO:(SHE)If perf issue, look at this to use directly the context instead of recreating an object on EACH change
export const useCoverEditorActiveMedia = ():
  | CoverEditorOverlayItem
  | CoverMedia
  | null => {
  const {
    coverEditorState: { editionMode, overlayLayers, medias, selectedItemIndex },
  } = useCoverEditorContext();
  if (editionMode === 'overlay' && selectedItemIndex != null) {
    const overlay = overlayLayers[selectedItemIndex];
    return overlay ?? null;
  } else if (editionMode === 'mediaEdit' && selectedItemIndex != null) {
    return medias[selectedItemIndex] ?? null;
  }
  return null;
};

export const useCoverEditorActiveImageMedia = (): CoverMediaImage | null => {
  const {
    coverEditorState: { editionMode, medias, selectedItemIndex },
  } = useCoverEditorContext();
  if (editionMode === 'mediaEdit' && selectedItemIndex != null) {
    const media = medias[selectedItemIndex];
    if (!media || media.kind !== 'image') {
      return null;
    }
    //direclty return the object instead of creating a new one
    return media;
  }
  return null;
};
