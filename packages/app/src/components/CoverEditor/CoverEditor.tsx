import { useAssets } from 'expo-asset';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import {
  DEFAULT_COLOR_LIST,
  DEFAULT_COLOR_PALETTE,
} from '@azzapp/shared/cardHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import ScreenModal from '#components/ScreenModal';
import { NativeBufferLoader, loadAllLUTShaders } from '#helpers/mediaEditions';
import { getVideoLocalPath } from '#helpers/mediaHelpers';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Text from '#ui/Text';
import CoverEditorContextProvider from './CoverEditorContext';
import { mediaInfoIsImage } from './coverEditorHelpers';
import CoverEditorMediaPicker from './CoverEditorMediaPicker';
import { coverEditorReducer } from './coverEditorReducer';
import CoverEditorSaveModal from './CoverEditorSaveModal';
import CoverEditorToolbox from './CoverEditorToolbox';
import { extractLottieInfoMemoized } from './coverEditorUtils';
import CoverPreview from './CoverPreview';
import useLottie from './useLottie';
import useSaveCover from './useSaveCover';
import type { Media } from '#helpers/mediaHelpers';
import type { CoverEditor_coverTemplate$key } from '#relayArtifacts/CoverEditor_coverTemplate.graphql';
import type { CoverEditor_profile$key } from '#relayArtifacts/CoverEditor_profile.graphql';
import type { CoverEditorAction } from './coverEditorActions';
import type { CoverEditorLinksToolActions } from './CoverEditorToolbox/tools/CoverEditorLinksTool';
import type {
  CoverEditorLinksLayerItem,
  CoverEditorOverlayItem,
  CoverEditorState,
  CoverEditorTextLayerItem,
} from './coverEditorTypes';
import type { Asset } from 'expo-asset';
import type { ForwardedRef, Reducer } from 'react';
import type { LayoutChangeEvent, ViewProps } from 'react-native';

export type CoverEditorProps = Omit<ViewProps, 'children'> & {
  profile: CoverEditor_profile$key;
  coverTemplate: CoverEditor_coverTemplate$key | null;
  backgroundColor: string | null;
  coverInitialSate?: Partial<CoverEditorState> | null;
  onCanSaveChange?: (canSave: boolean) => void;
};

export type CoverEditorHandle = {
  save: () => Promise<void>;
};

const CoverEditorWrapper = (
  {
    profile,
    coverTemplate,
    backgroundColor,
    onCanSaveChange,
    coverInitialSate,
    style,
    ...props
  }: CoverEditorProps,
  ref: ForwardedRef<CoverEditorHandle>,
) => {
  const [assets] = useAssets([
    require('#assets/webcard/cover_overlay_placeholder_logo.png'),
  ]);

  const placeholder = assets?.[0];

  return (
    placeholder?.downloaded && (
      <CoverEditor
        profile={profile}
        coverTemplate={coverTemplate}
        backgroundColor={backgroundColor}
        onCanSaveChange={onCanSaveChange}
        coverInitialSate={coverInitialSate}
        style={style}
        placeholder={placeholder}
        {...props}
        ref={ref}
      />
    )
  );
};

const CoverEditorCore = (
  {
    profile: profileKey,
    coverTemplate: coverTemplateKey,
    backgroundColor,
    onCanSaveChange,
    coverInitialSate,
    style,
    placeholder,
    ...props
  }: CoverEditorProps & { placeholder: Asset },
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
            otherColors
          }
          firstName
          lastName
          companyName
        }
      }
    `,
    profileKey,
  );

  const coverTemplate = useFragment(
    graphql`
      fragment CoverEditor_coverTemplate on CoverTemplate {
        id
        lottie
        data
      }
    `,
    coverTemplateKey,
  );
  // #endregion

  // Suspend
  const lottie = useLottie(coverTemplate?.lottie);

  // #region Store
  const [coverEditorState, dispatch] = useReducer<
    Reducer<CoverEditorState, CoverEditorAction>,
    null
  >(coverEditorReducer, null, () => {
    const data = coverTemplate?.data;

    const dataLinks = data?.linksLayer as
      | {
          links?: string[];
          color: string;
        }
      | undefined;

    const linksLayer: CoverEditorLinksLayerItem = dataLinks
      ? {
          ...dataLinks,
          position: {
            x: 50,
            y: 50,
          },
          size: 24,
          links:
            dataLinks.links?.map((link, index) => ({
              socialId: link,
              position: index,
              link: '?',
            })) ?? [],
          rotation: 0,
          shadow: false,
        }
      : {
          links: [],
          color: colors.black,
          size: 24,
          position: {
            x: 50,
            y: 50,
          },
          rotation: 0,
          shadow: false,
        };

    const textLayers: CoverEditorTextLayerItem[] = data?.textLayers
      ? (data.textLayers as any[]).map(textLayer => {
          const text =
            textLayer.text === 'mainName'
              ? profile.webCard.companyName || profile.webCard.lastName
              : textLayer.text === 'firstName'
                ? profile.webCard.firstName ?? ''
                : textLayer.text === 'custom'
                  ? textLayer.customText ?? ''
                  : '';
          return {
            ...textLayer,
            text,
            rotation: 0,
          };
        })
      : [];

    const overlayLayers = placeholder
      ? (data?.overlayLayers as any)?.map(
          (overlay: CoverEditorOverlayItem) => ({
            ...overlay,
            media: {
              uri: placeholder.localUri,
              type: 'image',
              width: placeholder.width,
              height: placeholder.height,
            },
            rotation: 0,
          }),
        ) ?? []
      : [];

    return {
      lottie,
      cardColors: {
        ...DEFAULT_COLOR_PALETTE,
        otherColors: [...DEFAULT_COLOR_LIST],
        ...profile.webCard.cardColors,
      } as any, // typescript is not happy with readonly
      backgroundColor: backgroundColor ?? 'light',

      medias: [],
      coverTransition: 'fade',

      overlayLayers,
      textLayers,
      linksLayer,

      editionMode: 'none',
      selectedItemIndex: null,

      images: {},
      videoPaths: {},
      lutShaders: {},

      loadingRemoteMedia: false,
      loadingLocalMedia: false,
      loadingError: null,

      ...coverInitialSate,
    };
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
    for (const overlayLayer of coverEditorState.overlayLayers) {
      const {
        media: { uri },
      } = overlayLayer;
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
          NativeBufferLoader.loadImage(uri).then(buffer => {
            if (canceled) {
              return;
            }
            images = {
              ...images,
              [uri]: buffer,
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
    coverEditorState.lutShaders,
    coverEditorState.images,
    coverEditorState.videoPaths,
    coverEditorState.overlayLayers,
  ]);

  const prevImages = useRef(coverEditorState.images);
  useEffect(() => {
    for (const uri in prevImages.current) {
      if (!coverEditorState.images[uri]) {
        NativeBufferLoader.unref(uri);
      }
    }
    for (const uri in coverEditorState.images) {
      if (!prevImages.current[uri]) {
        NativeBufferLoader.ref(uri);
      }
    }
    prevImages.current = coverEditorState.images;
  }, [coverEditorState.images]);

  // #endregion

  // #region Saving
  const { save, reset, savingStatus, progressIndicator, error, canSave } =
    useSaveCover(profile.webCard.id, coverEditorState);

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

  // #region Initial Media picking
  const [showImagePicker, toggleImagePicker] = useToggle(false);
  useEffect(() => {
    if (coverEditorState.medias.length === 0) {
      toggleImagePicker();
    }
  }, [coverEditorState.medias.length, toggleImagePicker]);

  const durations = useMemo(() => {
    const lottieInfo = extractLottieInfoMemoized(coverEditorState.lottie);
    return lottieInfo
      ? lottieInfo.assetsInfos.map(
          assetInfo => assetInfo.endTime - assetInfo.startTime,
        )
      : null;
  }, [coverEditorState.lottie]);

  const onMediasPicked = useCallback(
    (medias: Media[]) => {
      dispatch({
        type: 'UPDATE_MEDIAS',
        payload: medias,
      });
      toggleImagePicker();
    },
    [dispatch, toggleImagePicker],
  );

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

  const toolbox = useRef<CoverEditorLinksToolActions>(null);

  const onOpenLinksModal = useCallback(() => {
    toolbox.current?.toggleLinksModal();
  }, []);

  return (
    <>
      <CoverEditorContextProvider value={contextValue}>
        <Animated.View
          style={[
            styles.container,
            { marginBottom: bottom },
            style,
            animatedStyle,
          ]}
          {...props}
        >
          <Container style={styles.container}>
            <View style={styles.content} onLayout={onContentLayout}>
              {contentSize && (
                <CoverPreview
                  width={contentSize.width}
                  height={contentSize.height}
                  style={styles.coverPreview}
                  onKeyboardTranslateWorklet={onKeyboardTranslateWorklet}
                  onOpenLinksModal={onOpenLinksModal}
                />
              )}
            </View>
            <View style={{ height: 50 }} />
            <CoverEditorToolbox ref={toolbox} />
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
      <ScreenModal visible={showImagePicker} animationType="slide">
        <CoverEditorMediaPicker
          initialMedias={null}
          onFinished={onMediasPicked}
          durations={durations}
          durationsFixed={!!coverEditorState.lottie}
        />
      </ScreenModal>
    </>
  );
};

const CoverEditor = forwardRef(CoverEditorCore);

export default forwardRef(CoverEditorWrapper);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    margin: 40,
    alignSelf: 'center',
    aspectRatio: COVER_RATIO,
  },
  coverPreview: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
