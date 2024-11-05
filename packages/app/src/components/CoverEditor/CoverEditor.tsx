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
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, Platform, useWindowDimensions } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import {
  DEFAULT_COLOR_LIST,
  DEFAULT_COLOR_PALETTE,
} from '@azzapp/shared/cardHelpers';
import {
  COVER_IMAGE_DEFAULT_DURATION,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import { ScreenModal, preventModalDismiss } from '#components/NativeRouter';
import { NativeBufferLoader, loadAllLUTShaders } from '#helpers/mediaEditions';
import { getVideoLocalPath } from '#helpers/mediaHelpers';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Text from '#ui/Text';
import UploadProgressModal from '#ui/UploadProgressModal';
import CoverEditorContextProvider from './CoverEditorContext';
import {
  mediaInfoIsImage,
  extractLottieInfoMemoized,
  calculateImageScale,
  getMaxAllowedVideosPerCover,
  getLottieMediasDurations,
} from './coverEditorHelpers';
import CoverEditorMediaPicker from './CoverEditorMediaPicker';
import { coverEditorReducer } from './coverEditorReducer';
import CoverEditorSaveModal from './CoverEditorSaveModal';
import CoverEditorToolbox from './CoverEditorToolbox';
import CoverPreview from './CoverPreview';
import useLottie from './useLottie';
import useSaveCover from './useSaveCover';
import type { Media, MediaImage } from '#helpers/mediaHelpers';
import type { CoverEditor_coverTemplate$key } from '#relayArtifacts/CoverEditor_coverTemplate.graphql';
import type { CoverEditor_profile$key } from '#relayArtifacts/CoverEditor_profile.graphql';
import type { CoverEditorAction } from './coverEditorActions';
import type { CoverEditorLinksToolActions } from './CoverEditorToolbox/tools/CoverEditorLinksTool';
import type {
  CoverEditionProvidedMedia,
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
  coverInitialState?: Partial<CoverEditorState> | null;
  onCanSaveChange?: (canSave: boolean) => void;
  onCoverModified?: () => void;
  onCancel: () => void;
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
    coverInitialState,
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
        coverInitialState={coverInitialState}
        style={style}
        placeholder={placeholder}
        {...props}
        ref={ref}
      />
    )
  );
};

const ANDROID_ASSET_PATH =
  'file:///android_asset/cover_overlay_placeholder_logo.png';

const isAndroidRelease = Platform.OS === 'android' && !__DEV__;

const CoverEditorCore = (
  {
    profile: profileKey,
    coverTemplate: coverTemplateKey,
    backgroundColor,
    onCanSaveChange,
    onCoverModified,
    coverInitialState,
    style,
    placeholder,
    onCancel,
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
          companyActivity {
            id
            label
          }
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
        previewPositionPercentage
        colorPalette {
          primary
          light
          dark
        }
        medias {
          media {
            uri
            width
            height
          }
          index
          editable
        }
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
          position?: {
            x: number;
            y: number;
          };
          size?: number;
        }
      | undefined;

    const linksLayer: CoverEditorLinksLayerItem = dataLinks
      ? {
          ...dataLinks,
          position: dataLinks.position ?? {
            x: 50,
            y: 50,
          },
          size: dataLinks.size ?? 24,
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

    let textLayers: CoverEditorTextLayerItem[] = data?.textLayers
      ? (
          data.textLayers as Array<
            CoverEditorTextLayerItem & { customText: string | null }
          >
        ).map(({ customText, ...textLayer }) => {
          const text =
            textLayer.text === 'mainName'
              ? profile.webCard?.companyName || profile.webCard?.lastName
              : textLayer.text === 'firstName'
                ? profile.webCard?.companyActivity?.id
                  ? profile.webCard?.companyActivity?.label
                  : profile.webCard?.firstName
                : textLayer.text === 'custom'
                  ? customText
                  : null;
          return {
            ...textLayer,
            text: text ?? '',
          };
        })
      : [];

    textLayers = textLayers.filter(textLayer => !!textLayer.text);

    const overlayLayers = placeholder
      ? ((data?.overlayLayers as any)?.map((overlay: CoverEditorOverlayItem) =>
          placeholder.localUri
            ? {
                ...overlay,
                media: {
                  uri: isAndroidRelease ? ANDROID_ASSET_PATH : placeholder.uri,
                  kind: 'image',
                  width: placeholder.width,
                  height: placeholder.height,
                },
                rotation: 0,
              }
            : overlay,
        ) ?? [])
      : [];

    let imagesScales =
      coverInitialState?.medias?.reduce((acc, mediaInfo) => {
        if (mediaInfoIsImage(mediaInfo)) {
          return {
            ...acc,
            [mediaInfo.media.uri]: calculateImageScale(mediaInfo.media),
          };
        }
        return acc;
      }, {}) ?? {};

    if (coverInitialState?.overlayLayers) {
      imagesScales = coverInitialState.overlayLayers.reduce((acc, overlay) => {
        return {
          ...acc,
          [overlay.media.uri]: calculateImageScale(overlay.media),
        };
      }, imagesScales);
    }

    const cardColors =
      profile.webCard?.cardColors ?? coverTemplate?.colorPalette ?? {};

    // if we create a new cover without a new template and there is no cover already done
    // then we should interpolate the cover preview position
    const shouldComputeCoverPreviewPositionPercentage =
      !coverTemplate && !coverInitialState?.lottie;

    const lottieInfo = extractLottieInfoMemoized(lottie);
    const durations = lottieInfo ? getLottieMediasDurations(lottieInfo) : [];

    const providedMedias: CoverEditionProvidedMedia[] =
      coverTemplate?.medias.map(({ media, index, editable }) => ({
        index,
        editable,
        media: {
          media: {
            ...media,
            kind: 'image',
          },
          filter: null,
          animation: null,
          editionParameters: null,
          duration: durations ? durations[index] : COVER_IMAGE_DEFAULT_DURATION,
        },
      })) ?? [];

    return {
      isModified: false,
      lottie,
      cardColors: {
        ...DEFAULT_COLOR_PALETTE,
        otherColors: [...DEFAULT_COLOR_LIST],
        ...cardColors,
      } as any, // typescript is not happy with readonly
      backgroundColor: backgroundColor ?? 'light',

      medias: [],
      providedMedias,
      coverTransition: 'fade',

      overlayLayers,
      textLayers,
      linksLayer,

      editionMode: 'none',
      selectedItemIndex: null,

      images: {},
      imagesScales,
      videoPaths: {},
      lutShaders: {},

      loadingRemoteMedia: false,
      loadingLocalMedia: false,
      loadingError: null,
      coverPreviewPositionPercentage: coverTemplate?.previewPositionPercentage,
      shouldComputeCoverPreviewPositionPercentage,

      ...coverInitialState,
    };
  });

  useEffect(() => {
    if (coverEditorState.isModified) {
      onCoverModified?.();
    }
  }, [coverEditorState.isModified, onCoverModified]);

  const contextValue = useMemo(() => {
    return {
      coverEditorState,
      dispatch,
    };
  }, [coverEditorState, dispatch]);
  // #endregion

  const imageRefKeys = useRef<Record<string, string>>({});
  const [reloadCount, setReloadCount] = useState(0);
  // #region Resources loading
  useEffect(() => {
    let canceled = false;
    const abortController = new AbortController();
    const imagesToLoad: MediaImage[] = [];
    const videoToLoad: string[] = [];
    const fontsToLoad: string[] = [];
    for (const mediaInfo of coverEditorState.medias) {
      const {
        media: { uri },
      } = mediaInfo;
      if (mediaInfoIsImage(mediaInfo)) {
        if (!coverEditorState.images[uri]) {
          imagesToLoad.push(mediaInfo.media);
        }
      } else if (!coverEditorState.videoPaths[uri]) {
        videoToLoad.push(uri);
      }
    }
    for (const overlayLayer of coverEditorState.overlayLayers) {
      const { media } = overlayLayer;
      if (!coverEditorState.images[media.uri]) {
        imagesToLoad.push(media);
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
      imagesToLoad.some(({ uri }) => uri.startsWith('http')) ||
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

    const imagesScales = coverEditorState.imagesScales;

    if (imagesToLoad.length > 0) {
      promises.push(
        ...imagesToLoad.map(async media => {
          const scale = imagesScales[media.uri] ?? 1;
          const { key, promise } = NativeBufferLoader.loadImage(media.uri, {
            width: media.width * scale,
            height: media.height * scale,
          });

          const buffer = await promise;
          if (canceled) {
            return;
          }
          images = {
            ...images,
            [media.uri]: buffer,
          };
          imageRefKeys.current[media.uri] = key;
        }),
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
    coverEditorState.imagesScales,
    coverEditorState.providedMedias,
    // here to force the effect to run again when the reloadCount changes
    reloadCount,
  ]);

  const retryMediaLoading = useCallback(() => {
    setReloadCount(reloadCount => reloadCount + 1);
  }, []);

  useEffect(() => {
    const keys = imageRefKeys.current;
    Object.keys(coverEditorState.images).forEach(uri => {
      NativeBufferLoader.ref(keys[uri]);
    });
    return () => {
      Object.keys(coverEditorState.images).forEach(uri => {
        NativeBufferLoader.unref(keys[uri]);
      });
    };
  }, [coverEditorState.images]);
  // #endregion

  // #region Saving
  const {
    save,
    reset,
    savingStatus,
    exportProgressIndicator,
    uploadProgressIndicator,
    error,
    canSave,
  } = useSaveCover(profile.webCard?.id ?? null, coverEditorState);

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
  const showImagePicker = useMemo(() => {
    const lottieInfo = extractLottieInfoMemoized(coverEditorState.lottie);
    if (lottieInfo && lottieInfo.assetsInfos.length === 0) {
      return false;
    }
    if (coverEditorState.medias.length === 0) {
      return true;
    }
  }, [coverEditorState.lottie, coverEditorState.medias.length]);

  const durations = useMemo(() => {
    const lottieInfo = extractLottieInfoMemoized(coverEditorState.lottie);
    const infos = lottieInfo
      ? lottieInfo.assetsInfos.map(
          assetInfo => assetInfo.endTime - assetInfo.startTime,
        )
      : null;

    coverTemplate?.medias.forEach(media => {
      if (!media.editable) {
        infos?.splice(media.index, 1);
      }
    });

    return infos;
  }, [coverEditorState.lottie, coverTemplate?.medias]);

  const onMediasPicked = useCallback(
    (baseMedias: Media[]) => {
      const medias = [...baseMedias];

      coverEditorState.providedMedias.forEach(providedMedia => {
        if (!providedMedia.editable) {
          medias.splice(providedMedia.index, 0, providedMedia.media.media);
        }
      });

      dispatch({
        type: 'UPDATE_MEDIAS',
        payload: medias,
      });
    },
    [coverEditorState.providedMedias, dispatch],
  );

  // #region Layout and styles
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

  const editedInputPosition = useSharedValue(0);
  const onEditedInputPositionChange = useCallback(
    (y: number) => {
      editedInputPosition.value = y;
    },
    [editedInputPosition],
  );

  const {
    progress: keyboardProgressSharedValue,
    height: keyboardHeightSharedValue,
  } = useReanimatedKeyboardAnimation();

  const { height: windowHeight } = useWindowDimensions();

  const coverPreviewAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            keyboardProgressSharedValue.value,
            [0, 1],
            [
              0,
              keyboardHeightSharedValue.value +
                windowHeight / 2 -
                editedInputPosition.value,
            ],
          ),
        },
      ],
    };
  });

  // #endregion

  const toolbox = useRef<CoverEditorLinksToolActions>(null);

  const onOpenLinksModal = useCallback(() => {
    toolbox.current?.toggleLinksModal();
  }, []);

  const intl = useIntl();

  const [loadingRemoteMedia] = useDebounce(
    coverEditorState.loadingRemoteMedia,
    200,
  );

  const initialMedias = useMemo(() => {
    const initial = Array.from<Media | null>({
      length: durations?.length ?? 0,
    }).fill(null);

    coverEditorState.providedMedias.forEach(providedMedia => {
      if (providedMedia.editable) {
        const { media } = providedMedia.media;

        initial[providedMedia.index] =
          (providedMedia.index,
          0,
          {
            height: media.height,
            kind: 'image',
            uri: media.uri,
            width: media.width,
          });
      }
    });

    return initial;
  }, [coverEditorState.providedMedias, durations?.length]);

  const imagePicker = (
    <ScreenModal
      key="imagePicker"
      visible={showImagePicker}
      animationType="slide"
      onRequestDismiss={onCancel}
    >
      <CoverEditorMediaPicker
        initialMedias={initialMedias}
        durations={durations}
        durationsFixed={!!coverEditorState.lottie}
        maxSelectableVideos={getMaxAllowedVideosPerCover(
          !!coverEditorState.lottie,
        )}
        onFinished={onMediasPicked}
        onClose={onCancel}
      />
    </ScreenModal>
  );

  if (showImagePicker) {
    return imagePicker;
  }

  return (
    <>
      <View style={[styles.container, style]} {...props}>
        <CoverEditorContextProvider value={contextValue}>
          <Animated.View style={[styles.container, coverPreviewAnimatedStyle]}>
            <Container style={styles.container}>
              <View style={styles.content} onLayout={onContentLayout}>
                {contentSize && (
                  <CoverPreview
                    width={contentSize.width}
                    height={contentSize.height}
                    style={styles.coverPreview}
                    onEditedInputPositionChange={onEditedInputPositionChange}
                    onOpenLinksModal={onOpenLinksModal}
                  />
                )}
              </View>
            </Container>
          </Animated.View>
          <Container style={styles.toolBoxContainer}>
            <CoverEditorToolbox ref={toolbox} />
          </Container>
        </CoverEditorContextProvider>
      </View>

      <ScreenModal
        visible={savingStatus != null}
        onRequestDismiss={preventModalDismiss}
        gestureEnabled={false}
      >
        <CoverEditorSaveModal
          exportProgressIndicator={exportProgressIndicator}
          uploadProgressIndicator={uploadProgressIndicator}
        />
      </ScreenModal>
      <ScreenModal visible={error != null} onRequestDismiss={reset}>
        <Container
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            padding: 20,
          }}
        >
          <Text>
            <FormattedMessage
              defaultMessage="An error occurred, do not close Azzapp while saving your cover"
              description="Save Cover - Error message show when there is an issue saving the cover"
            />
          </Text>
          <Button onPress={reset} label="Ok" />
        </Container>
      </ScreenModal>
      <ScreenModal
        visible={loadingRemoteMedia}
        animationType="slide"
        onRequestDismiss={onCancel}
      >
        <UploadProgressModal
          text={intl.formatMessage({
            defaultMessage: 'Processing media',
            description: 'Cover Editor - Loading remote media',
          })}
          onCancel={onCancel}
        />
      </ScreenModal>

      <ScreenModal
        visible={coverEditorState.loadingError != null}
        onRequestDismiss={onCancel}
      >
        <Container
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            padding: 20,
          }}
        >
          <Text>
            <FormattedMessage
              defaultMessage="An error occurred while loading the media"
              description="Cover Editor - Loading media error message"
            />
          </Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <Button
              onPress={onCancel}
              label={
                <FormattedMessage
                  defaultMessage="Cancel"
                  description="Cover Editor - Loading media error cancel button"
                />
              }
            />
            <Button
              onPress={retryMediaLoading}
              label={
                <FormattedMessage
                  defaultMessage="Retry"
                  description="Cover Editor - Loading media error retry button"
                />
              }
            />
          </View>
        </Container>
      </ScreenModal>
      {imagePicker}
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
  toolBoxContainer: {
    paddingTop: 50,
  },
});
