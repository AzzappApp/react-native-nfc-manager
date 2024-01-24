import { pick } from 'lodash';
import {
  Suspense,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  startTransition,
  useEffect,
  useMemo,
} from 'react';
import { useIntl } from 'react-intl';
import {
  Keyboard,
  StyleSheet,
  View,
  unstable_batchedUpdates,
  useWindowDimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import {
  DEFAULT_COLOR_LIST,
  DEFAULT_COLOR_PALETTE,
} from '@azzapp/shared/cardHelpers';
import {
  COVER_RATIO,
  DEFAULT_COVER_SUBTITLE_TEXT_STYLE,
  DEFAULT_COVER_TEXT_STYLE,
  textOrientationOrDefault,
  textPositionOrDefault,
} from '@azzapp/shared/coverHelpers';
import {
  cropDataForAspectRatio,
  extractLayoutParameters,
} from '#components/gpu';
import ScreenModal from '#components/ScreenModal';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import BottomMenu, { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import BottomSheetModal from '#ui/BottomSheetModal';
import Container from '#ui/Container';
import { FLOATING_BUTTON_SIZE } from '#ui/FloatingButton';
import FloatingIconButton from '#ui/FloatingIconButton';
import TextInput from '#ui/TextInput';
import UploadProgressModal from '#ui/UploadProgressModal';
import CoverEditorCropModal from './CoverEditorCropModal';
import CoverEditorCustom from './CoverEditorCustom/CoverEditorCustom';
import CoverEditorImagePicker from './CoverEditorImagePicker';
import CoverEditorSuggestionButton from './CoverEditorSuggestionButton';
import CoverEditorTemplateList from './CoverEditorTemplateList';
import MediaRequiredModal from './MediaRequiredModal';
import { useTemplateSwitcherCoverMediaEditor } from './useCoverMediaEditor';
import useSaveCover from './useSaveCover';
import useSuggestedMedias from './useSuggestedMedias';
import type { EditionParameters } from '#components/gpu';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { CoverEditor_profile$key } from '#relayArtifacts/CoverEditor_profile.graphql';
import type { CoverEditorCustomProps } from './CoverEditorCustom/CoverEditorCustom';
import type {
  TemplateKind,
  CoverStyleData,
  MediaInfos,
} from './coverEditorTypes';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ForwardedRef } from 'react';
import type { TextInput as NativeTextInput } from 'react-native';

export type CoverEditorProps = {
  profile: CoverEditor_profile$key;
  height: number;
  onCoverSaved: () => void;
  onCanSaveChange: (canSave: boolean) => void;
};

export type CoverEditorHandle = {
  save: () => void;
};

const CoverEditor = (
  {
    profile: profileKey,
    height,
    onCoverSaved,
    onCanSaveChange,
  }: CoverEditorProps,
  ref: ForwardedRef<CoverEditorHandle>,
) => {
  const intl = useIntl();
  const { bottom: insetBottom } = useScreenInsets();

  // #region Data
  const profile = useFragment(
    graphql`
      fragment CoverEditor_profile on Profile {
        webCard {
          firstName
          lastName
          companyName
          companyActivity {
            label
          }
          webCardKind
          cardCover {
            title
            subTitle
            mediaParameters
            mediaFilter
            mediaAnimation
            sourceMedia {
              __typename
              id
              uri
              width
              height
            }
            maskMedia {
              id
              uri
            }
            background {
              id
              uri
              resizeMode
            }
            foreground {
              id
              kind
              uri
            }
            backgroundColor
            backgroundPatternColor
            foregroundColor
            segmented
            textOrientation
            textPosition
            textAnimation
            titleStyle {
              fontFamily
              fontSize
              color
            }
            subTitleStyle {
              fontFamily
              fontSize
              color
            }
          }
          cardColors {
            primary
            light
            dark
            otherColors
          }
          ...useSaveCover_webCard
        }
        ...CoverEditorCustom_profile
        ...CoverEditorTemplateList_profile
        ...useSuggestedMedias_profile
      }
    `,
    profileKey as CoverEditor_profile$key,
  );

  const cardCover = profile?.webCard.cardCover ?? null;
  const cardColors = profile?.webCard.cardColors ?? null;
  // #endregion

  // #region Template Kind
  const initialTemplateKind = useMemo<TemplateKind>(() => {
    if (cardCover) {
      return cardCover.sourceMedia?.__typename === 'MediaVideo'
        ? 'video'
        : cardCover.segmented
        ? 'people'
        : 'others';
    }
    return profile?.webCard.webCardKind === 'business' ? 'others' : 'people';
    // We don't want to update the initial data when the cardCover change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [templateKind, setTemplateKind] =
    useState<TemplateKind>(initialTemplateKind);

  const onSwitchTemplateKind = useCallback(
    async (kind: string) => {
      startTransition(() => {
        setTemplateKind(kind as TemplateKind);
      });
      const tostMessage =
        kind === 'people'
          ? intl.formatMessage({
              defaultMessage: "Remove background behind people's photo",
              description:
                'Toast message while switching to people in cover creation',
            })
          : kind === 'others'
          ? intl.formatMessage({
              defaultMessage: 'Add a photo yo your cover',
              description:
                'Toast message while switching to others in cover creation',
            })
          : intl.formatMessage({
              defaultMessage: 'Add a video to your cover',
              description:
                'Toast message while switching to viode in cover creation',
            });

      Toast.show({
        type: 'success',
        text1: tostMessage,
        bottomOffset: BOTTOM_MENU_HEIGHT + insetBottom,
      });
    },
    [insetBottom, intl, setTemplateKind],
  );
  // #endregion

  // #region Title/Subtitle state
  const [title, setTitle] = useState(() => {
    if (cardCover) {
      return cardCover.title ?? null;
    }
    if (profile?.webCard.webCardKind === 'business') {
      return profile.webCard.companyName ?? null;
    }
    return profile?.webCard.firstName ?? null;
  });

  const [subTitle, setSubTitle] = useState(() => {
    if (cardCover) {
      return cardCover.subTitle ?? null;
    }
    if (profile?.webCard.webCardKind === 'business') {
      return profile.webCard.companyActivity?.label ?? null;
    }
    return profile?.webCard.lastName ?? null;
  });
  // #endregion

  // #region Initial media state
  const initialCoverStyle = useMemo<CoverStyleData | null>(() => {
    if (!cardCover) {
      return null;
    }
    return {
      titleStyle: cardCover.titleStyle ?? DEFAULT_COVER_TEXT_STYLE,
      subTitleStyle:
        cardCover.subTitleStyle ?? DEFAULT_COVER_SUBTITLE_TEXT_STYLE,
      textOrientation: textOrientationOrDefault(cardCover.textOrientation),
      textPosition: textPositionOrDefault(cardCover.textPosition),
      textAnimation: cardCover?.textAnimation ?? null,
      mediaFilter: cardCover.mediaFilter ?? null,
      mediaAnimation: cardCover.mediaAnimation ?? null,
      mediaParameters: cardCover.mediaParameters
        ? extractLayoutParameters(
            cardCover.mediaParameters as EditionParameters,
          )[1]
        : {},
      background: cardCover.background ?? null,
      backgroundColor: cardCover.backgroundColor ?? '#FFF',
      backgroundPatternColor: cardCover.backgroundPatternColor ?? '#000',
      foreground: cardCover.foreground ?? null,
      foregroundColor: cardCover.foregroundColor ?? '#FFF',
      segmented: cardCover.segmented ?? false,
    };

    // We don't want to update the initial data when the cardCover change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialMediaInfos = useMemo<MediaInfos | null>(
    () => {
      if (!cardCover?.sourceMedia) {
        return null;
      }
      return {
        sourceMedia: {
          id: cardCover.sourceMedia.id,
          uri: cardCover.sourceMedia.uri,
          width: cardCover.sourceMedia.width,
          height: cardCover.sourceMedia.height,
          kind:
            cardCover.sourceMedia.__typename === 'MediaVideo'
              ? 'video'
              : 'image',
        },
        mediaCropParameters: extractLayoutParameters(
          cardCover.mediaParameters,
        )[0],
        maskMedia: cardCover.maskMedia,
      };
    },
    // We don't want to update the initial data when the cardCover change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  // #endregion

  // #region Media state
  const {
    sourceMedia,
    maskMedia,
    timeRange,
    mediaCropParameters,

    setMediaCropParameters,
    setSourceMediaFromImagePicker,

    mediaComputing,
    // TODO handle those case
    // mediaComputationError,
    // retryMediaComputation,
  } = useTemplateSwitcherCoverMediaEditor(
    templateKind,
    initialTemplateKind,
    initialMediaInfos,
  );

  const [mediaVisibleByTemplateKind, setMediaVisibleByTemplateKind] = useState({
    people: true,
    video: true,
    others: true,
  });

  const mediaVisible = mediaVisibleByTemplateKind[templateKind];
  const toggleMediaVisibility = useCallback(() => {
    setMediaVisibleByTemplateKind(previous => ({
      ...previous,
      [templateKind]: !previous[templateKind],
    }));
  }, [templateKind]);
  // #endregion

  // #region Color palette
  const [colorPalette, setColorPalette] = useState<ColorPalette>(
    cardColors
      ? pick(cardColors, 'dark', 'light', 'primary')
      : DEFAULT_COLOR_PALETTE,
  );
  // #endregion

  // #region Selection handling
  const [coverStyle, setCoverStyle] = useState<CoverStyleData>(
    () => initialCoverStyle ?? DEFAULT_COVER_STYLE,
  );
  const [currentMediaInfos, setCurrentMediaInfos] = useState<MediaInfos | null>(
    null,
  );
  const onSelectedTemplateChange = useCallback(
    (template: {
      id: string;
      style: CoverStyleData;
      mediaInfos: MediaInfos;
    }) => {
      unstable_batchedUpdates(() => {
        setCoverStyle(template.style);
        setCurrentMediaInfos(template.mediaInfos);
      });
    },
    [],
  );
  // #endregion

  // #region Suggested medias
  const {
    suggestedMedia,
    busy: suggestedMediaLoaderBusy,
    onNextSuggestedMedia,
  } = useSuggestedMedias(profile, templateKind);
  // #endregion

  // #region Save cover
  const { progressIndicator, saveCover } = useSaveCover(
    profile?.webCard ?? null,
    onCoverSaved,
  );

  const onSave = useCallback(() => {
    if (templateKind === 'people') {
      if (!sourceMedia) {
        setShowMediaRequiredModal(true);
        return;
      }
      if (!currentMediaInfos?.maskMedia) {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Please show your media before saving.',
            description:
              'Error toast message displayed when the user try to save a people cover with hidden media.',
          }),
        });
        return;
      }
    }
    if (mediaComputing) {
      return;
    }

    if (!currentMediaInfos) {
      // should not happen
      return;
    }
    const {
      sourceMedia: mediaInfoSourceMedia,
      maskMedia,
      mediaCropParameters,
    } = currentMediaInfos;

    saveCover(
      title,
      subTitle,
      coverStyle,
      mediaInfoSourceMedia,
      maskMedia,
      mediaCropParameters,
      colorPalette,
      cardColors?.otherColors ?? DEFAULT_COLOR_LIST,
    );
  }, [
    cardColors?.otherColors,
    colorPalette,
    coverStyle,
    currentMediaInfos,
    intl,
    mediaComputing,
    saveCover,
    sourceMedia,
    subTitle,
    templateKind,
    title,
  ]);

  const canSave = !mediaComputing;
  useEffect(() => {
    onCanSaveChange(canSave);
  }, [canSave, onCanSaveChange]);

  useImperativeHandle(
    ref,
    () => ({
      save: onSave,
    }),
    [onSave],
  );
  // #endregion

  // #region Custom edition
  const [customEditionProps, setCustomEditionProps] = useState<{
    initialData: CoverEditorCustomProps['initialData'];
    initialColorPalette: ColorPalette;
  } | null>(null);

  const onCustomEdition = useCallback(() => {
    if (
      !currentMediaInfos ||
      (templateKind === 'people' && !currentMediaInfos?.maskMedia) ||
      mediaComputing
    ) {
      return;
    }
    let { sourceMedia } = currentMediaInfos;
    const { maskMedia, mediaCropParameters } = currentMediaInfos;
    if (sourceMedia.rawUri) {
      sourceMedia = {
        ...sourceMedia,
        uri: sourceMedia.rawUri,
      };
      delete sourceMedia.rawUri;
    }
    setCustomEditionProps({
      initialData: {
        title,
        subTitle,
        coverStyle,
        sourceMedia,
        maskMedia,
        mediaCropParameters,
      },
      initialColorPalette: colorPalette,
    });
  }, [
    colorPalette,
    coverStyle,
    currentMediaInfos,
    mediaComputing,
    subTitle,
    templateKind,
    title,
  ]);

  const onCustomEditionCancel = useCallback(() => {
    setCustomEditionProps(null);
  }, []);
  // #endregion

  // #region Title modal
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const openTitleModal = useCallback(() => {
    setTitleModalOpen(true);
  }, []);

  const closeTitleModal = useCallback(() => {
    setTitleModalOpen(false);
    Keyboard.dismiss();
  }, []);

  const subTitleInputRef = useRef<NativeTextInput>(null);
  const focusSubTitle = useCallback(() => {
    subTitleInputRef.current?.focus();
  }, []);
  // #endregion

  // #region Image picker
  const [showImagePicker, setShowImagePicker] = useState(false);

  const openImagePicker = useCallback(() => {
    setShowImagePicker(true);
  }, []);

  const closeImagePicker = useCallback(() => {
    setShowImagePicker(false);
  }, []);

  const onMediaSelected = useCallback(
    (result: ImagePickerResult) => {
      setSourceMediaFromImagePicker(result);
      setShowImagePicker(false);
    },
    [setSourceMediaFromImagePicker],
  );
  // #endregion

  // #region Crop mode
  const [showCropModal, setShowCropModal] = useState(false);
  const openCropModal = useCallback(() => {
    setShowCropModal(true);
  }, []);

  const closeCropModal = useCallback(() => {
    setShowCropModal(false);
  }, []);

  const onSaveCropData = useCallback(
    (editionParameters: EditionParameters) => {
      setMediaCropParameters(editionParameters);
      setShowCropModal(false);
    },
    [setMediaCropParameters],
  );
  // #endregion

  // #region Media required modal
  const [showMediaRequiredModal, setShowMediaRequiredModal] = useState(false);
  const onMediaRequiredModalClose = useCallback(
    (openPicker: boolean) => {
      setShowMediaRequiredModal(false);
      if (openPicker) {
        openImagePicker();
      }
    },
    [openImagePicker],
  );
  // #endregion

  // #region Templates state
  const indexes = useRef({
    people: 0,
    video: 0,
    others: 0,
  });

  const onSelectedIndexChange = useCallback(
    (index: number) => {
      indexes.current[templateKind] = index;
    },
    [templateKind],
  );
  // #endregion

  // #region Displayed Media infos
  const suggestedMediaInfos = useMemo<MediaInfos | null>(() => {
    if (!suggestedMedia) {
      return null;
    }

    const { width, height } = suggestedMedia;

    return {
      sourceMedia: suggestedMedia,
      mediaCropParameters:
        Math.abs(width / height - COVER_RATIO) > 0.05
          ? { cropData: cropDataForAspectRatio(width, height, COVER_RATIO) }
          : null,
    };
  }, [suggestedMedia]);

  const displayedMediaInfos = useMemo<MediaInfos | null>(() => {
    if (!sourceMedia || !mediaVisible) {
      return suggestedMediaInfos ?? null;
    }

    return {
      sourceMedia,
      mediaCropParameters,
      maskMedia,
    };
  }, [
    maskMedia,
    mediaCropParameters,
    mediaVisible,
    sourceMedia,
    suggestedMediaInfos,
  ]);

  const currentCoverInfos = useMemo<{
    style: CoverStyleData;
    mediaInfos: MediaInfos;
  } | null>(() => {
    if (
      !initialMediaInfos ||
      !initialCoverStyle ||
      templateKind !== initialTemplateKind
    ) {
      return null;
    }

    return {
      style: initialCoverStyle,
      mediaInfos: displayedMediaInfos ?? initialMediaInfos,
    };
  }, [
    initialCoverStyle,
    initialMediaInfos,
    initialTemplateKind,
    displayedMediaInfos,
    templateKind,
  ]);
  //#endregion

  // #region Layout
  const { width: windowWidth } = useWindowDimensions();

  const templateListHeight = Math.min(
    height -
      (SMALL_GAP +
        BOTTOM_MENU_HEIGHT +
        SMALL_GAP +
        GAP +
        (FLOATING_BUTTON_SIZE * 2 + 10)),
    windowWidth / (COVER_RATIO * 1.5),
  );

  const templateListWidth = templateListHeight * COVER_RATIO * 2;
  // #endregion

  return (
    <>
      <Container style={[styles.root]}>
        <View
          style={{
            height: templateListHeight,
            width: templateListWidth,
            alignSelf: 'center',
            marginTop: 30,
          }}
        >
          <Suspense
            fallback={
              <View
                style={{
                  height: templateListHeight,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator />
              </View>
            }
          >
            <CoverEditorTemplateList
              key={templateKind}
              profile={profile}
              templateKind={templateKind}
              mediaInfos={displayedMediaInfos}
              title={title}
              subTitle={subTitle}
              videoPaused={!!progressIndicator || customEditionProps != null}
              width={templateListWidth}
              height={templateListHeight}
              timeRange={timeRange}
              currentCoverInfos={currentCoverInfos}
              cardColors={cardColors ?? null}
              initialSelectedIndex={indexes.current[templateKind]}
              onSelectedItemChange={onSelectedTemplateChange}
              onColorPaletteChange={setColorPalette}
              onSelectedIndexChange={onSelectedIndexChange}
              mediaComputing={mediaComputing}
            />
          </Suspense>
        </View>
        <View
          style={[
            styles.controlPanel,
            {
              marginBottom: BOTTOM_MENU_HEIGHT + insetBottom,
            },
          ]}
        >
          <FloatingIconButton icon="camera" onPress={openImagePicker} />
          <FloatingIconButton icon="text" onPress={openTitleModal} />
          <CoverEditorSuggestionButton
            key={templateKind}
            sourceMedia={sourceMedia}
            templateKind={templateKind}
            mediaVisible={mediaVisible}
            toggleMediaVisibility={toggleMediaVisibility}
            suggestedMediaLoaderBusy={suggestedMediaLoaderBusy}
            onNextSuggestedMedia={onNextSuggestedMedia}
            hasSuggestedMedia={!!suggestedMedia}
          />
          {sourceMedia && (
            <FloatingIconButton
              icon="crop"
              onPress={openCropModal}
              disabled={!mediaVisible}
            />
          )}
          <FloatingIconButton
            icon="settings"
            onPress={onCustomEdition}
            disabled={
              templateKind === 'people' && !currentMediaInfos?.maskMedia
            }
          />
        </View>
        <BottomMenu
          currentTab={templateKind}
          onItemPress={onSwitchTemplateKind}
          tabs={useMemo(
            () => [
              {
                key: 'people',
                icon: 'silhouette',
                label: intl.formatMessage({
                  defaultMessage: 'People',
                  description: 'Cover editor people tab bar item label',
                }),
              },
              {
                key: 'video',
                icon: 'video',
                label: intl.formatMessage({
                  defaultMessage: 'Video',
                  description: 'Cover editor video tab bar item label',
                }),
              },
              {
                key: 'others',
                icon: 'landscape',
                label: intl.formatMessage({
                  defaultMessage: 'Others',
                  description: 'Cover editor others tab bar item label',
                }),
              },
            ],
            [intl],
          )}
          showLabel={true}
          style={[
            {
              position: 'absolute',
              alignSelf: 'center',
            },
            { bottom: insetBottom, width: 210 },
          ]}
        />
      </Container>

      <BottomSheetModal
        height={MODAL_HEIGHT}
        visible={titleModalOpen}
        onRequestClose={closeTitleModal}
        showGestureIndicator={false}
      >
        <View style={styles.modalContent}>
          <TextInput
            value={title ?? ''}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={focusSubTitle}
          />
          <TextInput
            ref={subTitleInputRef}
            value={subTitle ?? ''}
            onChangeText={setSubTitle}
            returnKeyType="done"
            onSubmitEditing={closeTitleModal}
          />
        </View>
      </BottomSheetModal>
      <ScreenModal visible={showImagePicker} animationType="slide">
        <CoverEditorImagePicker
          kind={templateKind === 'video' ? 'video' : 'image'}
          onFinished={onMediaSelected}
          onCancel={closeImagePicker}
        />
      </ScreenModal>
      <MediaRequiredModal
        visible={showMediaRequiredModal}
        onClose={onMediaRequiredModalClose}
      />
      <CoverEditorCropModal
        visible={showCropModal}
        media={sourceMedia}
        maskMedia={coverStyle?.segmented ? maskMedia : null}
        title={title}
        subTitle={subTitle}
        timeRange={timeRange}
        coverStyle={coverStyle}
        mediaParameters={mediaCropParameters}
        colorPalette={colorPalette}
        onClose={closeCropModal}
        onSave={onSaveCropData}
      />
      <ScreenModal visible={!!progressIndicator}>
        {progressIndicator && (
          <UploadProgressModal progressIndicator={progressIndicator} />
        )}
      </ScreenModal>
      <ScreenModal visible={customEditionProps != null} animationType="fade">
        {customEditionProps && (
          <CoverEditorCustom
            {...customEditionProps}
            onCancel={onCustomEditionCancel}
            onCoverSaved={onCoverSaved}
            profile={profile}
          />
        )}
      </ScreenModal>
    </>
  );
};

export default forwardRef(CoverEditor);

export const GAP = 16;
export const SMALL_GAP = 9;
export const MODAL_HEIGHT = 160;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: SMALL_GAP,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tabBarIcon: {
    width: 22,
    height: 22,
  },
  controlPanel: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  modalContent: {
    height: MODAL_HEIGHT,
    justifyContent: 'space-around',
    padding: 20,
  },
});

const DEFAULT_COVER_STYLE: CoverStyleData = {
  background: null,
  backgroundColor: 'light',
  backgroundPatternColor: 'dark',
  foreground: null,
  foregroundColor: 'primary',
  mediaFilter: null,
  mediaParameters: {},
  mediaAnimation: null,
  segmented: false,
  subTitleStyle: DEFAULT_COVER_SUBTITLE_TEXT_STYLE,
  textOrientation: 'horizontal',
  textPosition: 'bottomLeft',
  textAnimation: null,
  titleStyle: DEFAULT_COVER_TEXT_STYLE,
};
