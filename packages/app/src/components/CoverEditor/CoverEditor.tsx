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
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import ScreenModal from '#components/ScreenModal';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import BottomMenu, { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import BottomSheetModal from '#ui/BottomSheetModal';
import Container from '#ui/Container';
import { FLOATING_BUTTON_SIZE } from '#ui/FloatingButton';
import FloatingIconButton from '#ui/FloatingIconButton';
import TextInput from '#ui/TextInput';
import CoverEditorCustom from './CoverEditorCustom/CoverEditorCustom';
import CoverEditorSuggestionButton from './CoverEditorSuggestionButton';
import CoverEditorTemplateList from './CoverEditorTemplateList';
import useCoverEditionManager from './useCoverEditionManager';
import type { TemplateKind, ColorPalette } from './coverEditorTypes';
import type { CoverData } from './useCoverEditionManager';
import type { CoverEditor_viewer$key } from '@azzapp/relay/artifacts/CoverEditor_viewer.graphql';
import type { useSuggestedMediaManager_suggested$key } from '@azzapp/relay/artifacts/useSuggestedMediaManager_suggested.graphql';
import type { ForwardedRef } from 'react';
import type { TextInput as NativeTextInput } from 'react-native';

export type CoverEditorProps = {
  viewer: CoverEditor_viewer$key & useSuggestedMediaManager_suggested$key;
  height: number;
  initialTemplateKind?: TemplateKind;
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
    initialTemplateKind = 'people',
    onCoverSaved,
    onCanSaveChange,
  }: CoverEditorProps,
  ref: ForwardedRef<CoverEditorHandle>,
) => {
  const intl = useIntl();
  // #region Data
  const viewer = useFragment(
    graphql`
      fragment CoverEditor_viewer on Viewer {
        profile {
          ...CoverEditorSuggestionButton_profile
          ...useCoverEditionManager_profile
        }
        ...CoverEditorCustom_viewer
        ...CoverEditorTemplateList_viewer
      }
    `,
    viewerKey as CoverEditor_viewer$key,
  );

  // #endregion

  // #region Data edition

  const {
    title,
    subTitle,
    activeSourceMedia,
    sourceMedia,
    maskMedia,
    mediaCropParameter,
    coverStyle,
    timeRange,
    colorPalette,
    currentCoverStyle,
    cardColors,
    modals,
    mediaComputing,
    mediaVisible,
    showSuggestedMedia,
    hasSuggestedMedia,
    templateKind,
    // TODO handle
    // mediaComputationError
    setTitle,
    setSubTitle,
    setCoverStyle,
    setColorPalette,
    toggleCropMode,
    openImagePicker,
    onSave,
    toggleMediaVisibility,
    selectSuggestedMedia,
    updateEditedMediaKind,
    setTemplateKind,
  } = useCoverEditionManager({
    initialData: null,
    initialColorPalette: null,
    onCoverSaved,
    initialTemplateKind,
    profile: viewer.profile ?? null,
    viewer: viewerKey,
  });
  // #endregion

  // #region Preview media
  const [previewMedia, setPreviewMedia] = useState<
    CoverData['sourceMedia'] | null
  >(null);

  const onPreviewMediaChange = useCallback(
    (media: CoverData['sourceMedia']) => {
      setPreviewMedia(media);
    },
    [],
  );

  // #region Title modal
  const { bottom: insetBottom } = useScreenInsets();
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

  // #region Custom edition
  const [customEditionProps, setCustomEditionProps] = useState<{
    initialData: CoverData;
    colorPalette: ColorPalette;
    previewMedia: CoverData['sourceMedia'] | null;
  } | null>(null);

  const onCustomEdition = useCallback(() => {
    if (mediaComputing) {
      return;
    }
    setCustomEditionProps({
      initialData: {
        title,
        subTitle,
        sourceMedia: activeSourceMedia,
        maskMedia,
        mediaCropParameter,
        coverStyle,
      },
      colorPalette,
      previewMedia,
    });
  }, [
    mediaComputing,
    title,
    subTitle,
    activeSourceMedia,
    maskMedia,
    mediaCropParameter,
    coverStyle,
    colorPalette,
    previewMedia,
  ]);

  const onCustomEditionCancel = useCallback(() => {
    setCustomEditionProps(null);
  }, []);

  const onCustomCoverSaved = useCallback(() => {
    setCustomEditionProps(null);
    onCoverSaved();
  }, [onCoverSaved]);

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
  // #endregion

  const templateListWidth = templateListHeight * COVER_RATIO * 2;

  useImperativeHandle(
    ref,
    () => ({
      save: onSave,
    }),
    [onSave],
  );

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

  // #region Suggested Media
  const onPressSuggestedMedia = useCallback(() => {
    selectSuggestedMedia(templateKind);
  }, [selectSuggestedMedia, templateKind]);

  // #region Template Kind
  const onSwitchTemplateKind = useCallback(
    async (kind: string) => {
      startTransition(() => {
        // We try to take advantage of the transition to reduce the flickering
        // but it's not perfect, and we would need to use react 18 concurrent mode
        unstable_batchedUpdates(() => {
          setTemplateKind(kind as TemplateKind);
          updateEditedMediaKind(kind as TemplateKind);
        });
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
    [insetBottom, intl, setTemplateKind, updateEditedMediaKind],
  );

  // #region canSave
  const canSave = !mediaComputing;

  useEffect(() => {
    onCanSaveChange(canSave);
  }, [canSave, onCanSaveChange]);
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
              viewer={viewer}
              templateKind={templateKind}
              media={activeSourceMedia}
              maskUri={
                templateKind === 'people' ? maskMedia?.uri ?? null : null
              }
              showTemplatesMedias={!mediaVisible}
              title={title}
              subTitle={subTitle}
              width={templateListWidth}
              height={templateListHeight}
              mediaCropParameters={mediaCropParameter}
              timeRange={timeRange}
              currentCoverStyle={
                initialTemplateKind === templateKind ? currentCoverStyle : null
              }
              cardColors={cardColors ?? null}
              initialSelectedIndex={indexes.current[templateKind]}
              onPreviewMediaChange={onPreviewMediaChange}
              onCoverStyleChange={setCoverStyle}
              onColorPaletteChange={setColorPalette}
              onSelectedIndexChange={onSelectedIndexChange}
              mediaComputing={mediaComputing}
              showSuggestedMedia={showSuggestedMedia}
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
              onSelectSuggestedMedia={onPressSuggestedMedia}
            />
          )}
          {(sourceMedia || hasSuggestedMedia) && (
            <FloatingIconButton
              icon="crop"
              onPress={toggleCropMode}
              disabled={!mediaVisible && !hasSuggestedMedia}
            />
          )}
          <FloatingIconButton icon="settings" onPress={onCustomEdition} />
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
      {modals}
      <ScreenModal visible={customEditionProps != null} animationType="fade">
        {customEditionProps && (
          <CoverEditorCustom
            initialData={customEditionProps.initialData}
            initialColorPalette={customEditionProps.colorPalette}
            previewMedia={customEditionProps.previewMedia}
            onCancel={onCustomEditionCancel}
            onCoverSaved={onCustomCoverSaved}
            viewer={viewer}
            templateKind={templateKind}
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
