import {
  Suspense,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  startTransition,
  useEffect,
} from 'react';
import { FormattedMessage } from 'react-intl';
import {
  Image,
  Keyboard,
  Modal,
  StyleSheet,
  View,
  unstable_batchedUpdates,
  useWindowDimensions,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
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
import type { ForwardedRef } from 'react';
import type { TextInput as NativeTextInput } from 'react-native';

export type CoverEditorProps = {
  viewer: CoverEditor_viewer$key;
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
          ...useCoverEditionManager_profile
        }
        ...CoverEditorCustom_viewer
        ...CoverEditorTemplateList_viewer
      }
    `,
    viewerKey,
  );

  // #endregion

  // #region Data edition
  const [templateKind, setTemplateKind] =
    useState<TemplateKind>(initialTemplateKind);

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
    // TODO handle
    // mediaComputationError
    coverPreviewRef,
    setTitle,
    setSubTitle,
    setCoverStyle,
    setColorPalette,
    toggleCropMode,
    openImagePicker,
    onSave,
    updateEditedMediaKind,
  } = useCoverEditionManager({
    initialData: null,
    initialColorPalette: null,
    onCoverSaved,
    initialTemplateKind: templateKind === 'video' ? 'video' : 'image',
    profile: viewer.profile ?? null,
  });

  const onSwitchTemplateKind = useCallback(
    async (kind: TemplateKind) => {
      startTransition(() => {
        // We try to take advantage of the transition to reduce the flickering
        // but it's not perfect, and we would need to use react 18 concurrent mode
        unstable_batchedUpdates(() => {
          setTemplateKind(kind);
          updateEditedMediaKind(kind === 'video' ? 'video' : 'image');
        });
      });
    },
    [updateEditedMediaKind],
  );
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

  // #region Media visibility
  const [mediaVisible, setMediaVisible] = useState(true);
  const toggleMediaVisibility = useCallback(() => {
    setMediaVisible(mediaVisible => !mediaVisible);
  }, []);
  // #endregion

  // #region canSave
  const canSave = !mediaComputing && mediaVisible;

  useEffect(() => {
    onCanSaveChange(canSave);
  }, [canSave, onCanSaveChange]);
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
              coverPreviewRef={coverPreviewRef}
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
              mediaComputing={mediaComputing}
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
              <Image
                source={{ uri: sourceMedia.uri }}
                style={[
                  styles.mediaHideButtonImage,
                  !mediaVisible && { opacity: 0.5 },
                ]}
              />
              <Icon
                style={styles.mediaHideButtonIcon}
                icon={mediaVisible ? 'display' : 'hide'}
              />
            </PressableOpacity>
          )}
          {sourceMedia && (
            <FloatingIconButton
              icon="crop"
              onPress={toggleCropMode}
              disabled={!mediaVisible}
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
            onCoverSaved={onCoverSaved}
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
  },
  mediaHideButtonImage: {
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
  },
  mediaHideButtonIcon: {
    position: 'absolute',
    top: (FLOATING_BUTTON_SIZE - 24) / 2,
    left: (FLOATING_BUTTON_SIZE - 24) / 2,
    width: 24,
    height: 24,
  },
});
