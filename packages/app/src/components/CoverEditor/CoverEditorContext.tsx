import { createContext, useContext, useEffect, useReducer } from 'react';
import { colors } from '#theme';
import { SKImageLoader, loadAllLUTShaders } from '#helpers/mediaEditions';
import { getVideoLocalPath } from '#helpers/mediaHelpers';
import { mediaInfoIsImage } from './coverEditorHelpers';
import { coverEditorReducer } from './coverEditorReducer';
import type { CoverEditorAction } from './coverEditorActions';
import type { CoverEditorState } from './coverEditorTypes';

export type CoverEditorContextType = {
  coverEditorState: CoverEditorState;
  dispatch: React.Dispatch<CoverEditorAction>;
};

const CoverEditorContext = createContext<CoverEditorContextType | null>(null);

export type CoverEditorContextProviderProps = {
  children: React.ReactNode;
};

const CoverEditorContextProvider = ({
  children,
}: CoverEditorContextProviderProps) => {
  const [coverEditorState, dispatch] = useReducer(coverEditorReducer, {
    textLayers: [],
    selectedLayerIndex: null,
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

    images: {},
    videoPaths: {},
    lutShaders: {},

    // Loading state
    loadingRemoteMedia: false,
    loadingLocalMedia: false,
  });

  useEffect(() => {
    let canceled = false;
    const abortController = new AbortController();
    const imagesToLoad: string[] = [];
    const videoToLoad: string[] = [];
    const fontsToLoad: string[] = [];
    for (const mediaInfo of coverEditorState.medias) {
      const {
        media: { uri },
      } = mediaInfo;
      if (mediaInfoIsImage(mediaInfo)) {
        if (!coverEditorState.images[uri]) {
          imagesToLoad.push(uri);
        }
      } else if (!coverEditorState.videoPaths[uri]) {
        videoToLoad.push(uri);
      }
    }
    if (coverEditorState.overlayLayer) {
      const { media } = coverEditorState.overlayLayer;
      if (!coverEditorState.images[media?.uri]) {
        imagesToLoad.push(media.uri);
      }
    }

    const lutShadersLoaded = !!Object.keys(coverEditorState.lutShaders).length;
    if (
      imagesToLoad.length === 0 &&
      videoToLoad.length === 0 &&
      fontsToLoad.length === 0 &&
      lutShadersLoaded
    ) {
      return () => {};
    }

    const loadingRemoteMedia =
      imagesToLoad.some(uri => uri.startsWith('http')) ||
      videoToLoad.some(uri => uri.startsWith('http'));
    dispatch({
      type: 'LOADING_START',
      payload: {
        remote: loadingRemoteMedia,
      },
    });
    const promises: Array<Promise<void>> = [];
    let lutShaders = coverEditorState.lutShaders;
    let images = coverEditorState.images;
    let videoPaths = coverEditorState.videoPaths;
    if (!lutShadersLoaded) {
      promises.push(
        loadAllLUTShaders().then(result => {
          if (canceled) {
            return;
          }
          lutShaders = result;
        }),
      );
    }
    if (imagesToLoad.length > 0) {
      promises.push(
        ...imagesToLoad.map(uri =>
          SKImageLoader.loadImage(uri).then(image => {
            if (canceled) {
              return;
            }
            images = {
              ...images,
              [uri]: image,
            };
          }),
        ),
      );
    }
    if (videoToLoad.length > 0) {
      promises.push(
        ...videoToLoad.map(uri =>
          getVideoLocalPath(uri, abortController.signal).then(path => {
            if (canceled) {
              return;
            }
            if (!path) {
              throw new Error('Video not found for uri ' + uri);
            }
            videoPaths = {
              ...videoPaths,
              [uri]: path,
            };
          }),
        ),
      );
    }

    Promise.all(promises).then(
      () => {
        if (canceled) {
          return;
        }
        dispatch({
          type: 'LOADING_SUCCESS',
          payload: {
            lutShaders,
            images,
            videoPaths,
          },
        });
      },
      error => {
        if (canceled) {
          return;
        }
        dispatch({
          type: 'LOADING_ERROR',
          payload: {
            error,
          },
        });
      },
    );

    return () => {
      canceled = true;
      abortController.abort();
    };
  }, [
    coverEditorState.medias,
    coverEditorState.overlayLayer,
    coverEditorState.lutShaders,
    coverEditorState.images,
    coverEditorState.videoPaths,
  ]);

  return (
    <CoverEditorContext.Provider
      value={{
        coverEditorState,
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
