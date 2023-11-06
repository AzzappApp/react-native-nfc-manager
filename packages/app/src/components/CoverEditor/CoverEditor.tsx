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
import { Keyboard, StyleSheet, View, useWindowDimensions } from 'react-native';
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
  textOrientationOrDefaut,
  textPositionOrDefaut,
} from '@azzapp/shared/coverHelpers';
import { extractLayoutParameters } from '#components/gpu';
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
import CoverEditiorImagePicker from './CoverEditorImagePicker';
import CoverEditorSuggestionButton from './CoverEditorSuggestionButton';
import CoverEditorTemplateList from './CoverEditorTemplateList';
import MediaRequiredModal from './MediaRequiredModal';
import { useTemplateSwitcherCoverMediaEditor } from './useCoverMediaEditor';
import useSaveCover from './useSaveCover';
import useSuggestedMedias from './useSuggestedMedias';
import type { EditionParameters } from '#components/gpu';
import type { ImagePickerResult } from '#components/ImagePicker';
import type { CoverEditorCustomProps } from './CoverEditorCustom/CoverEditorCustom';
import type {
  TemplateKind,
  CoverStyleData,
  SourceMedia,
} from './coverEditorTypes';
import type { CoverEditor_viewer$key } from '@azzapp/relay/artifacts/CoverEditor_viewer.graphql';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ForwardedRef } from 'react';
import type { TextInput as NativeTextInput } from 'react-native';

export type CoverEditorProps = {
  viewer: CoverEditor_viewer$key;
  height: number;
  onCoverSaved: () => void;
  onCanSaveChange: (canSave: boolean) => void;
};

export type CoverEditorHandle = {
  save: () => void;
};

const CoverEditor = (
  {
    viewer: viewerKey,
    height,
    onCoverSaved,
    onCanSaveChange,
  }: CoverEditorProps,
  ref: ForwardedRef<CoverEditorHandle>,
) => {
  const intl = useIntl();
  const { bottom: insetBottom } = useScreenInsets();

  // #region Data
  const viewer = useFragment(
    graphql`
      fragment CoverEditor_viewer on Viewer {
        profile {
          firstName
          lastName
          companyName
          companyActivity {
            label
          }
          profileKind
          cardCover {
            title
            subTitle
            mediaParameters
            mediaFilter
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
              uri
            }
            backgroundColor
            backgroundPatternColor
            foregroundColor
            segmented
            merged
            textOrientation
            textPosition
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
          ...CoverEditorSuggestionButton_profile
          ...useSaveCover_profile
        }
        ...CoverEditorCustom_viewer
        ...CoverEditorTemplateList_viewer
        ...useSuggestedMedias_viewer
      }
    `,
    viewerKey as CoverEditor_viewer$key,
  );

  const cardCover = viewer?.profile?.cardCover ?? null;
  const cardColors = viewer?.profile?.cardColors ?? null;

  // #endregion
  const initialTemplateKind = useMemo<TemplateKind>(() => {
    if (cardCover) {
      return cardCover.sourceMedia?.__typename === 'MediaVideo'
        ? 'video'
        : cardCover.segmented
        ? 'people'
        : 'others';
    }
    return viewer.profile?.profileKind === 'business' ? 'others' : 'people';
    // We don't want to update the initial data when the cardCover change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [templateKind, setTemplateKind] =
    useState<TemplateKind>(initialTemplateKind);

  // #region Template Kind
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

  // #region Data edition
  const [title, setTitle] = useState(() => {
    if (cardCover) {
      return cardCover.title ?? null;
    }
    if (viewer.profile?.profileKind === 'business') {
      return viewer.profile.companyName ?? null;
    }
    return viewer.profile?.firstName ?? null;
  });

  const [subTitle, setSubTitle] = useState(() => {
    if (cardCover) {
      return cardCover.subTitle ?? null;
    }
    if (viewer.profile?.profileKind === 'business') {
      return viewer.profile.companyActivity?.label ?? null;
    }
    return viewer.profile?.lastName ?? null;
  });

  const initialCoverStyle = useMemo<CoverStyleData | null>(() => {
    if (!cardCover) {
      return null;
    }
    return {
      titleStyle: cardCover.titleStyle ?? DEFAULT_COVER_TEXT_STYLE,
      subTitleStyle:
        cardCover.subTitleStyle ?? DEFAULT_COVER_SUBTITLE_TEXT_STYLE,
      textOrientation: textOrientationOrDefaut(cardCover.textOrientation),
      textPosition: textPositionOrDefaut(cardCover.textPosition),
      mediaFilter: cardCover.mediaFilter ?? null,
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
      merged: cardCover.merged ?? false,
      segmented: cardCover.segmented ?? false,
    };

    // We don't want to update the initial data when the cardCover change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [coverStyle, setCoverStyle] = useState<CoverStyleData>(
    () => initialCoverStyle ?? DEFAULT_COVER_STYLE,
  );

  const initialMediaInfos = useMemo(
    () =>
      cardCover
        ? {
            sourceMedia: cardCover.sourceMedia
              ? ({
                  id: cardCover.sourceMedia.id,
                  uri: cardCover.sourceMedia.uri,
                  height: cardCover.sourceMedia.height,
                  width: cardCover.sourceMedia.width,
                  kind:
                    cardCover.sourceMedia.__typename === 'MediaVideo'
                      ? 'video'
                      : 'image',
                } as const)
              : null,
            maskMedia: cardCover.maskMedia,
            mediaCropParameters: extractLayoutParameters(
              cardCover.mediaParameters,
            )[0],
          }
        : null,

    // We don't want to update the initial data when the cardCover change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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

  const [colorPalette, setColorPalette] = useState<ColorPalette>(
    cardColors
      ? pick(cardColors, 'dark', 'light', 'primary')
      : DEFAULT_COLOR_PALETTE,
  );

  const currentDemoMediaRef = useRef<SourceMedia | null>(null);
  const onSelectedTemplateChange = useCallback(
    (template: { style: CoverStyleData; media: SourceMedia }) => {
      setCoverStyle(template.style);
      currentDemoMediaRef.current = template.media;
    },
    [setCoverStyle],
  );
  // #endregion

  // #region Suggested Media
  const { suggestedMedia, onNextSuggestedMedia } = useSuggestedMedias(
    viewer,
    templateKind,
  );

  // #region Save cover
  const { progressIndicator, saveCover } = useSaveCover(
    viewer.profile,
    onCoverSaved,
  );

  const onSave = useCallback(() => {
    if (templateKind === 'people' && !sourceMedia) {
      setShowMediaRequiredModal(true);
      return;
    }
    if (mediaComputing) {
      return;
    }
    let media: SourceMedia | null = null;
    let cropParameters: EditionParameters = {};
    if (mediaVisible) {
      media = sourceMedia;
      cropParameters = mediaCropParameters ?? {};
    }
    if (!media) {
      media = suggestedMedia ?? currentDemoMediaRef.current;
    }
    if (!media) {
      // should not happend
      return;
    }

    saveCover(
      title,
      subTitle,
      coverStyle,
      maskMedia,
      cropParameters,
      media,
      colorPalette,
      cardColors?.otherColors ?? DEFAULT_COLOR_LIST,
    );
  }, [
    cardColors?.otherColors,
    colorPalette,
    coverStyle,
    maskMedia,
    mediaComputing,
    mediaCropParameters,
    mediaVisible,
    saveCover,
    sourceMedia,
    subTitle,
    suggestedMedia,
    templateKind,
    title,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      save: onSave,
    }),
    [onSave],
  );
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

  // #region Custom edition
  const [customEditionProps, setCustomEditionProps] = useState<{
    initialData: CoverEditorCustomProps['initialData'];
    initialColorPalette: ColorPalette;
  } | null>(null);

  const onCustomEdition = useCallback(() => {
    if (mediaComputing) {
      return;
    }
    let media: SourceMedia | null = null;
    let cropParameters: EditionParameters = {};
    if (mediaVisible) {
      media = sourceMedia;
      cropParameters = mediaCropParameters ?? {};
    }
    if (!media) {
      media = suggestedMedia ?? currentDemoMediaRef.current;
    }
    if (!media) {
      // should not happend
      return;
    }
    setCustomEditionProps({
      initialData: {
        title,
        subTitle,
        sourceMedia: {
          id: media.id,
          width: media.width,
          height: media.height,
          uri: media.rawUri ?? media.uri,
          kind: media.kind,
        },
        maskMedia,
        mediaCropParameters: cropParameters,
        coverStyle,
      },
      initialColorPalette: colorPalette,
    });
  }, [
    colorPalette,
    coverStyle,
    maskMedia,
    mediaComputing,
    mediaCropParameters,
    mediaVisible,
    sourceMedia,
    subTitle,
    suggestedMedia,
    title,
  ]);

  const onCustomEditionCancel = useCallback(() => {
    setCustomEditionProps(null);
  }, []);
  // #endregion

  // #region Media required modal
  const [showMediaRequiredModal, setShowMediaRequiredModal] = useState(false);
  const onMediaRequiredModalClose = useCallback(() => {
    setShowMediaRequiredModal(false);
    openImagePicker();
  }, [openImagePicker]);
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

  // #region canSave
  const canSave = !mediaComputing;

  useEffect(() => {
    onCanSaveChange(canSave);
  }, [canSave, onCanSaveChange]);
  // #endregion

  const displayedMedia = mediaVisible
    ? sourceMedia ?? suggestedMedia
    : suggestedMedia;

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
              viewer={viewer}
              templateKind={templateKind}
              media={displayedMedia ?? null}
              maskUri={
                mediaVisible && templateKind === 'people'
                  ? maskMedia?.uri ?? null
                  : null
              }
              title={title}
              subTitle={subTitle}
              videoPaused={!!progressIndicator}
              width={templateListWidth}
              height={templateListHeight}
              mediaCropParameters={mediaVisible ? mediaCropParameters : null}
              timeRange={timeRange}
              currentCoverStyle={
                initialTemplateKind === templateKind ? initialCoverStyle : null
              }
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
          {viewer?.profile && (
            <CoverEditorSuggestionButton
              profile={viewer.profile}
              sourceMedia={sourceMedia}
              templateKind={templateKind}
              mediaVisible={mediaVisible}
              toggleMediaVisibility={toggleMediaVisibility}
              onSelectSuggestedMedia={onNextSuggestedMedia}
            />
          )}
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
              templateKind === 'people' && (!sourceMedia || !mediaVisible)
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
        <CoverEditiorImagePicker
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
            viewer={viewer}
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
  merged: false,
  segmented: false,
  subTitleStyle: DEFAULT_COVER_SUBTITLE_TEXT_STYLE,
  textOrientation: 'horizontal',
  textPosition: 'bottomLeft',
  titleStyle: DEFAULT_COVER_TEXT_STYLE,
};
