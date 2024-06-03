import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import ScreenModal from '#components/ScreenModal';
import { SKImageLoader, loadAllLUTShaders } from '#helpers/mediaEditions';
import { getVideoLocalPath } from '#helpers/mediaHelpers';
import { useSkiaApplicationFonts } from '#hooks/useApplicationFonts';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Text from '#ui/Text';
import CoverEditorContextProvider from './CoverEditorContext';
import { mediaInfoIsImage } from './coverEditorHelpers';
import { coverEditorReducer } from './coverEditorReducer';
import CoverEditorSaveModal from './CoverEditorSaveModal';
import CoverPreview from './CoverPreview';
import CoverEditorToolbox from './toolbox/CoverEditorToolbox';
import useSaveCover from './useSaveCover';
import type { TemplateTypePreview } from '#components/CoverEditorTemplateList';
import type { CoverEditor_profile$key } from '#relayArtifacts/CoverEditor_profile.graphql';
import type { ForwardedRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';

export type CoverEditorProps = {
  profile: CoverEditor_profile$key;
  coverTemplatePreview: TemplateTypePreview | null;
  backgroundColor: string | null;
  onCanSaveChange?: (canSave: boolean) => void;
};

export type CoverEditorHandle = {
  save: () => Promise<void>;
};

const CoverEditor = (
  {
    profile: profileKey,
    coverTemplatePreview,
    backgroundColor,
    onCanSaveChange,
  }: CoverEditorProps,
  ref: ForwardedRef<CoverEditorHandle>,
) => {
  // #region Data
  const profile = useFragment(
    graphql`
      fragment CoverEditor_profile on Profile {
        webCard {
          id
          cardColors {
            primary
            light
            dark
          }
        }
        ...CoverEditorToolbox_profile
      }
    `,
    profileKey,
  );
  // #endregion

  // #region Store
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

    backgroundColor,
  });

  const contextValue = useMemo(() => {
    return {
      coverEditorState,
      dispatch,
    };
  }, [coverEditorState, dispatch]);
  // #endregion

  // #region Resources loading
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
      const {
        media: { uri },
      } = coverEditorState.overlayLayer;
      if (!coverEditorState.images[uri]) {
        imagesToLoad.push(uri);
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
  const fontManager = useSkiaApplicationFonts();
  // #endregion

  // #region Saving
  const { save, reset, savingStatus, progressIndicator, error, canSave } =
    useSaveCover(
      profile.webCard.id,
      coverEditorState,
      fontManager,
      profile.webCard.cardColors ?? DEFAULT_COLOR_PALETTE,
    );

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  useEffect(() => {
    onCanSaveChange?.(canSave);
  }, [canSave, onCanSaveChange]);

  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        if (!canSave) {
          throw new Error('Cover is not in a valid state to be saved');
        }
        return save();
      },
    }),
    [save, canSave],
  );

  // #endregion

  // #region Layout and styles
  const { bottom } = useScreenInsets();
  const [contentSize, setContentSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const onContentLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      setContentSize({
        width: layout.width,
        height: layout.height,
      });
    },
    [],
  );

  const translateYSharedValue = useSharedValue(0);
  const onKeyboardTranslateWorklet = useCallback(
    (translateY: number) => {
      'worklet';
      translateYSharedValue.value = translateY;
    },
    [translateYSharedValue],
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateYSharedValue.value }],
    };
  });
  // #endregion

  return (
    <>
      <CoverEditorContextProvider value={contextValue}>
        <Animated.View
          style={[styles.container, { marginBottom: bottom }, animatedStyle]}
        >
          <Container style={styles.container}>
            <View style={styles.content} onLayout={onContentLayout}>
              {contentSize && fontManager && (
                <CoverPreview
                  width={contentSize.width}
                  height={contentSize.height}
                  style={styles.coverPreview}
                  fontManager={fontManager}
                  cardColors={profile.webCard.cardColors}
                  onKeyboardTranslateWorklet={onKeyboardTranslateWorklet}
                />
              )}
            </View>
            <View style={{ height: 50 }} />
            <CoverEditorToolbox
              coverTemplatePreview={coverTemplatePreview}
              profile={profile}
            />
          </Container>
        </Animated.View>
      </CoverEditorContextProvider>

      <ScreenModal visible={savingStatus != null}>
        <CoverEditorSaveModal
          status={savingStatus}
          progressIndicator={progressIndicator}
        />
      </ScreenModal>
      <ScreenModal visible={error != null}>
        <Container
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            padding: 20,
          }}
        >
          <Text>{error?.message ?? error?.toString()}</Text>
          <Button onPress={reset} label="Ok" />
        </Container>
      </ScreenModal>
    </>
  );
};

export default forwardRef(CoverEditor);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    margin: 40,
  },
  coverPreview: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
