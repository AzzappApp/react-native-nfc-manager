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
import { FormattedMessage } from 'react-intl';
import {
  Keyboard,
  Modal,
  StyleSheet,
  View,
  unstable_batchedUpdates,
  useWindowDimensions,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import { GPUImageView, VideoFrame, Image as ImageLayer } from '#components/gpu';
import ActivityIndicator from '#ui/ActivityIndicator';
import BottomSheetModal from '#ui/BottomSheetModal';
import Container from '#ui/Container';
import { FLOATING_BUTTON_SIZE } from '#ui/FloatingButton';
import FloatingIconButton from '#ui/FloatingIconButton';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import TabBarMenuItem, { TAB_BAR_MENU_ITEM_HEIGHT } from '#ui/TabBarMenuItem';
import TextInput from '#ui/TextInput';
import CoverEditorCustom from './CoverEditorCustom/CoverEditorCustom';
import CoverEditorTemplateList from './CoverEditorTemplateList';
import useCoverEditionManager from './useCoverEditionManager';
import type { ColorPalette, TemplateKind } from './coverEditorTypes';
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
  // #region Data
  const viewer = useFragment(
    graphql`
      fragment CoverEditor_viewer on Viewer {
        profile {
          profileKind
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
    suggestedMedia,
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
        sourceMedia,
        maskMedia,
        mediaCropParameter,
        coverStyle,
      },
      colorPalette,
      previewMedia,
    });
  }, [
    mediaComputing,
    colorPalette,
    coverStyle,
    maskMedia,
    mediaCropParameter,
    previewMedia,
    sourceMedia,
    subTitle,
    title,
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
        TAB_BAR_MENU_ITEM_HEIGHT +
        SMALL_GAP +
        GAP +
        FLOATING_BUTTON_SIZE),
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

  const showSuggestedMedia = useMemo(
    () =>
      templateKind !== 'people' &&
      (!mediaVisible || sourceMedia == null) &&
      viewer.profile?.profileKind === 'business',
    [sourceMedia, mediaVisible, templateKind, viewer.profile?.profileKind],
  );

  const onPressSuggestedMedia = useCallback(() => {
    selectSuggestedMedia(templateKind);
  }, [selectSuggestedMedia, templateKind]);

  // #region Template Kind
  const onSwitchTemplateKind = useCallback(
    async (kind: TemplateKind) => {
      startTransition(() => {
        // We try to take advantage of the transition to reduce the flickering
        // but it's not perfect, and we would need to use react 18 concurrent mode
        unstable_batchedUpdates(() => {
          setTemplateKind(kind);
          updateEditedMediaKind(kind);
        });
      });
    },
    [setTemplateKind, updateEditedMediaKind],
  );

  // #region canSave
  const canSave = !mediaComputing;

  // (((mediaVisible || sourceMedia == null) &&
  //   (viewer?.profile?.profileKind === 'personal' ||
  //     templateKind === 'people')) ||
  //   (viewer?.profile?.profileKind === 'business' &&
  //     templateKind !== 'people' &&
  //     mediaVisible)); //

  useEffect(() => {
    onCanSaveChange(canSave);
  }, [canSave, onCanSaveChange]);
  // #endregion

  return (
    <>
      <Container style={styles.root}>
        <View style={styles.tabBarContainer} accessibilityRole="tablist">
          <TabBarMenuItem
            selected={templateKind === 'people'}
            setSelected={() => onSwitchTemplateKind('people')}
            icon="silhouette"
          >
            <FormattedMessage
              defaultMessage="People"
              description="Cover editor people tab bar item label"
            />
          </TabBarMenuItem>
          <TabBarMenuItem
            selected={templateKind === 'video'}
            setSelected={() => onSwitchTemplateKind('video')}
            icon="video"
          >
            <FormattedMessage
              defaultMessage="Video"
              description="Cover editor video tab bar item label"
            />
          </TabBarMenuItem>

          <TabBarMenuItem
            selected={templateKind === 'others'}
            setSelected={() => onSwitchTemplateKind('others')}
            icon="landscape"
          >
            <FormattedMessage
              defaultMessage="Others"
              description="Cover editor others tab bar item label"
            />
          </TabBarMenuItem>
        </View>
        <View
          style={{
            height: templateListHeight,
            width: templateListWidth,
            alignSelf: 'center',
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
              media={sourceMedia}
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
              onSelectSuggestedMedia={onPressSuggestedMedia}
              mediaComputing={mediaComputing}
              suggestedMedia={suggestedMedia}
              showSuggestedMedia={showSuggestedMedia}
            />
          </Suspense>
        </View>
        <View style={styles.controlPanel}>
          <FloatingIconButton icon="camera" onPress={openImagePicker} />
          <FloatingIconButton icon="text" onPress={openTitleModal} />
          {sourceMedia && (
            <PressableOpacity
              style={[styles.mediaHideButton]}
              onPress={toggleMediaVisibility}
            >
              <GPUImageView
                style={[
                  styles.mediaHideButtonImage,
                  !mediaVisible && { opacity: 0.5 },
                  { overflow: 'hidden' },
                ]}
                testID="image-picker-media-video"
              >
                {sourceMedia.kind === 'image' ? (
                  <ImageLayer uri={sourceMedia.uri} />
                ) : (
                  <VideoFrame uri={sourceMedia.uri} time={0} />
                )}
              </GPUImageView>

              <Icon
                style={styles.mediaHideButtonIcon}
                icon={mediaVisible ? 'display' : 'hide'}
              />
            </PressableOpacity>
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
      <Modal
        visible={customEditionProps != null}
        transparent
        animationType="fade"
        onRequestClose={onCustomEditionCancel}
      >
        {customEditionProps && (
          <CoverEditorCustom
            initialData={customEditionProps.initialData}
            initialColorPalette={customEditionProps.colorPalette}
            previewMedia={customEditionProps.previewMedia}
            onCancel={onCustomEditionCancel}
            onCoverSaved={onCustomCoverSaved}
            viewer={viewer}
          />
        )}
      </Modal>
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
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: GAP,
  },
  modalContent: {
    height: MODAL_HEIGHT,
    justifyContent: 'space-around',
    padding: 20,
  },
  mediaHideButton: {
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    borderColor: colors.black,
    borderWidth: 1,
    borderStyle: 'solid',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaHideButtonImage: {
    width: FLOATING_BUTTON_SIZE - 6,
    height: FLOATING_BUTTON_SIZE - 6,
    borderRadius: (FLOATING_BUTTON_SIZE - 4) / 2,
  },
  mediaHideButtonIcon: {
    position: 'absolute',
    top: (FLOATING_BUTTON_SIZE - 24) / 2,
    left: (FLOATING_BUTTON_SIZE - 24) / 2,
    width: 24,
    height: 24,
  },
});
