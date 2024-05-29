import { createContext, useCallback, useContext, useReducer } from 'react';
import { colors } from '#theme';
import { CoverEditorActionType } from './coverEditorActions';
import { coverEditorReducer } from './coverEditorReducer';
import type { CoverEditorAction } from './coverEditorActions';
import type {
  CoverEditorSelectedLayer,
  CoverEditorState,
} from './coverEditorTypes';

export type CoverEditorContextType = {
  cover: CoverEditorState;
  currentEditableItem: CoverEditorSelectedLayer;
  setCurrentEditableItem: (item: CoverEditorSelectedLayer) => void;
  dispatch: React.Dispatch<CoverEditorAction>;
};

const CoverEditorContext = createContext<CoverEditorContextType | null>(null);

export type CoverEditorContextProviderProps = {
  children: React.ReactNode;
};

const CoverEditorContextProvider = ({
  children,
}: CoverEditorContextProviderProps) => {
  const [cover, dispatch] = useReducer(coverEditorReducer, {
    textLayers: [],
    selectedLayer: null,
    overlayLayer: null,
    linksLayer: {
      links: [],
      style: {
        color: colors.black,
        size: 24,
      },
    },
    layerMode: null,
    medias: [],
    template: null,
    coverTransition: 'slide',
  });

  const setCurrentEditableItem = useCallback(
    (selectedLayer: CoverEditorSelectedLayer) => {
      dispatch({
        type: CoverEditorActionType.SelectLayer,
        payload: selectedLayer,
      });
    },
    [],
  );

  return (
    <CoverEditorContext.Provider
      value={{
        cover,
        currentEditableItem: cover.selectedLayer,
        setCurrentEditableItem,
        dispatch,
      }}
    >
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
  const { cover, currentEditableItem } = useCoverEditorContext();

  if (cover.overlayLayer == null || currentEditableItem?.type !== 'overlay') {
    //returning null (when not selected), will reduce the number of bottom sheet/screen modal etc in memory
    return null;
  }
  return cover.overlayLayer!;
};

export const useCoverEditorTextLayer = () => {
  const { cover, currentEditableItem } = useCoverEditorContext();

  if (currentEditableItem?.type !== 'text') return null;
  return cover.textLayers[currentEditableItem.index];
};

export const useCoverEditorLinksLayer = () => {
  const { cover, currentEditableItem } = useCoverEditorContext();

  if (currentEditableItem?.type !== 'links') return null;
  return cover.linksLayer;
};

export const useCoverEditorMedia = () => {
  const { cover, currentEditableItem } = useCoverEditorContext();

  if (currentEditableItem?.type !== 'media') return null;
  return cover.medias[currentEditableItem.index];
};
