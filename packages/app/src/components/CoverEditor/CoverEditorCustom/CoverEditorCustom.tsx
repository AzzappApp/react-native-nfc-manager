import { memoize } from 'lodash';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { DEFAULT_COLOR_LIST } from '@azzapp/shared/cardHelpers';
import {
  COVER_RATIO,
  textOrientationOrDefaut,
  textPositionOrDefaut,
} from '@azzapp/shared/coverHelpers';
import { CameraButton, CropButton } from '#components/commonsButtons';
import CoverPreviewRenderer from '#components/CoverPreviewRenderer';
import ImageEditionFooter from '#components/ImageEditionFooter';
import ImageEditionParameterControl from '#components/ImageEditionParameterControl';
import ScreenModal from '#components/ScreenModal';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import PressableNative from '#ui/PressableNative';
import SwitchLabel from '#ui/SwitchLabel';
import TabView from '#ui/TabView';
import UploadProgressModal from '#ui/UploadProgressModal';
import CoverEditorCropModal from '../CoverEditorCropModal';
import CoverEditiorImagePicker from '../CoverEditorImagePicker';
import useCoverMediaEditor from '../useCoverMediaEditor';
import useSaveCover from '../useSaveCover';
import CoverEditorCustomBackgroundPanel from './CECBackgroundPanel';
import CoverEditorCustomBottomMenu from './CECBottomMenut';
import { TOP_PANEL_GAP, TOP_PANEL_PADDING } from './cecConstants';
import CECForegroundPanel from './CECForegroundPanel';
import CECHeader from './CECHeader';
import CECImageEditionPanel from './CECImageEditionPanel';
import CECTitlePanel from './CECTitlePanel';
import CECToolBar from './CECToolBar';
import useCoverEditorCustomLayout from './useCoverEditorCustomLayout';
import type { EditionParameters } from '#components/gpu';
import type { ImagePickerResult } from '#components/ImagePicker';
import type {
  CoverStyleData,
  MaskMedia,
  SourceMedia,
} from '../coverEditorTypes';
import type { CoverEditorCustom_viewer$key } from '@azzapp/relay/artifacts/CoverEditorCustom_viewer.graphql';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { StyleProp, ViewStyle } from 'react-native';

export type CoverEditorCustomProps = {
  /**
   * The relay viewer reference
   */
  viewer: CoverEditorCustom_viewer$key;
  /**
   * The cover initial data
   */
  initialData: {
    title?: string | null;
    subTitle?: string | null;
    sourceMedia: SourceMedia;
    maskMedia?: MaskMedia | null;
    mediaCropParameters?: EditionParameters | null;
    coverStyle: CoverStyleData;
  };
  /**
   * colorPalette
   */
  initialColorPalette: ColorPalette;
  /**
   * style of the screen
   */
  style?: StyleProp<ViewStyle>;
  /**
   * callback called when the screen is ready to be displayed
   */
  onReady?: () => void;
  /**
   *  callback called when the image fails to load
   */
  onError?: () => void;
  /**
   * callback when to save the cover
   */
  onCoverSaved: () => void;
  /**
   * callback called when the user cancel the cover edition
   */
  onCancel: () => void;
};

/**
 * Allows un user to edit his Cover, the cover changes, can be previsualized
 */
const CoverEditorCustom = ({
  viewer: viewerKey,
  initialData,
  initialColorPalette,
  style,
  // onReady,
  onError,
  onCoverSaved,
  onCancel,
}: CoverEditorCustomProps) => {
  //#region Data dependencies
  const viewer = useFragment(
    graphql`
      fragment CoverEditorCustom_viewer on Viewer {
        ...CECBackgroundPanel_viewer
        ...CECForegroundPanel_viewer
        profile {
          webCard {
            ...useSaveCover_webCard
            cardColors {
              otherColors
            }
          }
        }
        coverBackgrounds {
          id
          uri
        }
        coverForegrounds {
          id
          uri
        }
      }
    `,
    viewerKey,
  );
  const { coverBackgrounds, coverForegrounds } = viewer ?? {};
  const cardColors = viewer?.profile?.webCard.cardColors;
  //#endregion

  //#region Updates management
  const [title, setTitle] = useState(initialData?.title ?? null);
  const [subTitle, setSubTitle] = useState(initialData?.subTitle ?? null);
  const [coverStyle, setCoverStyle] = useState<CoverStyleData>(
    () => initialData.coverStyle,
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
  } = useCoverMediaEditor(initialData);

  const [colorPalette, setColorPalette] =
    useState<ColorPalette>(initialColorPalette);

  const [otherColors, setOtherColors] = useState<string[]>(
    cardColors?.otherColors?.slice() ?? DEFAULT_COLOR_LIST,
  );
  //#endregion

  const onFilterChange = useCallback(
    (mediaFilter: string) => {
      setCoverStyle(style => ({
        ...style,
        mediaFilter,
      }));
    },
    [setCoverStyle],
  );

  const [editedParameter, setEditedParameter] = useState<
    keyof EditionParameters | null
  >(null);

  const editionParametersSave = useRef(coverStyle.mediaParameters);

  const onStartParameterEdition = useCallback(
    (param: keyof EditionParameters) => {
      editionParametersSave.current = coverStyle.mediaParameters;
      setEditedParameter(param);
    },
    [coverStyle.mediaParameters],
  );

  const onParameterValueChange = useCallback(
    <T extends keyof EditionParameters>(
      param: T,
      value: EditionParameters[T],
    ) => {
      setCoverStyle(coverStyle => ({
        ...coverStyle,
        mediaParameters: {
          ...coverStyle.mediaParameters,
          [param]: value,
        },
      }));
    },
    [setCoverStyle],
  );

  const onEditedParameterValueChange = useCallback(
    (value: any) => {
      onParameterValueChange(editedParameter!, value);
    },
    [editedParameter, onParameterValueChange],
  );

  const onParameterEditionSave = useCallback(() => {
    setEditedParameter(null);
  }, []);

  const onParameterEditionCancel = useCallback(() => {
    setCoverStyle(coverStyle => ({
      ...coverStyle,
      mediaParameters: editionParametersSave.current,
    }));
    setEditedParameter(null);
  }, [setCoverStyle]);

  const createStyleFieldUpdater = useMemo<
    <T extends keyof CoverStyleData>(
      field: T,
    ) => (value: CoverStyleData[T]) => void
  >(
    () =>
      memoize(field => value => {
        setCoverStyle(coverStyle => ({
          ...coverStyle,
          [field]: value,
        }));
      }),
    [setCoverStyle],
  );

  const onTitleChange = setTitle;

  const onTitleStyleChange = createStyleFieldUpdater('titleStyle');

  const onSubTitleChange = setSubTitle;

  const onSubTitleStyleChange = createStyleFieldUpdater('subTitleStyle');

  const onTextOrientationChange = createStyleFieldUpdater('textOrientation');

  const onTextPositionChange = createStyleFieldUpdater('textPosition');

  const onBackgroundChange = useCallback(
    (id: string | null) => {
      setCoverStyle(coverStyle => ({
        ...coverStyle,
        background: id
          ? coverBackgrounds?.find(bg => bg.id === id) ?? null
          : null,
      }));
    },
    [coverBackgrounds, setCoverStyle],
  );

  const onBackgroundColorChange = createStyleFieldUpdater('backgroundColor');

  const onBackgroundPatternColorChange = createStyleFieldUpdater(
    'backgroundPatternColor',
  );

  const onForegroundChange = useCallback(
    (id: string | null) => {
      setCoverStyle(coverStyle => ({
        ...coverStyle,
        foreground: id
          ? coverForegrounds?.find(fg => fg.id === id) ?? null
          : null,
      }));
    },
    [coverForegrounds, setCoverStyle],
  );

  const onForegroundColorChange = createStyleFieldUpdater('foregroundColor');
  //#endregion

  // #region Save cover
  const { progressIndicator, saveCover } = useSaveCover(
    viewer.profile?.webCard ?? null,
    onCoverSaved,
  );

  const onSave = useCallback(() => {
    if (mediaComputing || !sourceMedia) {
      return;
    }

    saveCover(
      title,
      subTitle,
      coverStyle,
      maskMedia,
      mediaCropParameters ?? {},
      sourceMedia,
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
    saveCover,
    sourceMedia,
    subTitle,
    title,
  ]);
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

  const errorDispatched = useRef(false);
  const onMediaError = useCallback(() => {
    if (!errorDispatched.current) {
      errorDispatched.current = true;
      onError?.();
    }
  }, [onError]);
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

  //#region Segmentation and merge
  const segmentationEnabled = useMemo(
    () => sourceMedia?.kind !== 'video' && (mediaComputing || maskMedia),
    [maskMedia, mediaComputing, sourceMedia?.kind],
  );

  const onToggleSegmentation = useCallback(() => {
    setCoverStyle(coverStyle => ({
      ...coverStyle,
      segmented: !coverStyle.segmented,
    }));
  }, [setCoverStyle]);

  // TODO reenable merge when we support it again
  // const onToggleMerge = useCallback(() => {
  //   setCoverStyle(coverStyle => ({
  //     ...coverStyle,
  //     merged: !coverStyle.merged,
  //   }));
  // }, [setCoverStyle]);
  //#endregion

  const [currentTab, setCurrentTab] = useState('image');
  const navigateToPanel = useCallback((menu: string) => {
    setCurrentTab(menu);
  }, []);

  const kind = sourceMedia?.kind ?? 'image';
  const uri = sourceMedia?.uri ?? null;
  const editionParameters = useMemo<EditionParameters>(
    () => ({
      ...coverStyle.mediaParameters,
      ...mediaCropParameters,
    }),
    [coverStyle.mediaParameters, mediaCropParameters],
  );

  const {
    background,
    backgroundColor,
    backgroundPatternColor,
    foreground,
    foregroundColor,
    mediaFilter,
    merged,
    segmented,
    subTitleStyle,
    textOrientation,
    textPosition,
    titleStyle,
  } = coverStyle;

  const {
    windowWidth,
    bottomPanelHeight,
    topPanelHeight,
    coverHeight,
    topPanelButtonsTop,
    insetTop,
    insetBottom,
    bottomSheetHeights,
  } = useCoverEditorCustomLayout();

  const intl = useIntl();

  return (
    //ths container on top avoid some weid feeling when transitionning with transparent backgorund
    <Container style={[styles.root, style]}>
      <KeyboardAvoidingView
        contentContainerStyle={[
          styles.keyboardAvoidingView,
          { paddingTop: insetTop },
        ]}
        behavior="position"
      >
        <CECHeader
          // TODO
          isCreation={false}
          canSave={!mediaComputing}
          onCancel={onCancel}
          onSave={onSave}
          editedParameter={editedParameter}
        />
        <View style={[styles.topPanel, { height: topPanelHeight }]}>
          <PressableNative
            style={{ height: coverHeight, aspectRatio: COVER_RATIO }}
            onPress={openImagePicker}
          >
            <CoverPreviewRenderer
              kind={kind}
              uri={uri}
              maskUri={segmentationEnabled && segmented ? maskMedia?.uri : null}
              foregroundId={foreground?.id}
              foregroundImageUri={foreground?.uri}
              foregroundImageTintColor={foregroundColor}
              backgroundImageUri={background?.uri}
              backgroundColor={backgroundColor}
              backgroundMultiply={merged}
              backgroundImageTintColor={backgroundPatternColor}
              editionParameters={editionParameters}
              filter={mediaFilter}
              title={title}
              subTitle={subTitle}
              titleStyle={titleStyle}
              subTitleStyle={subTitleStyle}
              textOrientation={textOrientationOrDefaut(textOrientation)}
              textPosition={textPositionOrDefaut(textPosition)}
              computing={mediaComputing}
              // onReady={onCoverPreviewReady}
              onError={onMediaError}
              height={coverHeight}
              colorPalette={colorPalette}
              paused={!!progressIndicator}
            />
          </PressableNative>
          {sourceMedia && !editedParameter && (
            <CropButton
              onPress={openCropModal}
              style={{
                position: 'absolute',
                top: topPanelButtonsTop,
                end: 22.5,
              }}
            />
          )}
          {!editedParameter && (
            <CameraButton
              onPress={openImagePicker}
              style={{
                position: 'absolute',
                top: topPanelButtonsTop,
                start: 22.5,
              }}
            />
          )}

          <CECToolBar>
            {segmentationEnabled && (
              <SwitchLabel
                variant="small"
                value={segmented ?? false}
                onValueChange={onToggleSegmentation}
                label={intl.formatMessage({
                  defaultMessage: 'Clipping',
                  description: 'Label of the clipping switch in cover edition',
                })}
              />
            )}
            {/*
              We for the moment disable merging since we don't supporting it anymore with
              background extraction
            */}
            {/* <SwitchLabel
              variant="small"
              value={merged ?? false}
              onValueChange={onToggleMerge}
              label={intl.formatMessage({
                defaultMessage: 'Merge',
                description: 'Label of the merge switch in cover edition',
              })}
            /> */}
          </CECToolBar>
        </View>

        <TabView
          currentTab={currentTab}
          style={{
            marginTop: 10,
            height: bottomPanelHeight - insetBottom - BOTTOM_MENU_HEIGHT,
            width: windowWidth,
          }}
          tabs={[
            {
              id: 'image',
              element: (
                <CECImageEditionPanel
                  uri={uri}
                  kind={kind}
                  filter={mediaFilter}
                  editionParameters={editionParameters}
                  merged={merged}
                  onFilterChange={onFilterChange}
                  onStartParameterEdition={onStartParameterEdition}
                  style={{ flex: 1 }}
                />
              ),
            },
            {
              id: 'title',
              element: (
                <CECTitlePanel
                  title={title}
                  subTitle={subTitle}
                  titleStyle={titleStyle}
                  subTitleStyle={subTitleStyle}
                  textOrientation={textOrientation}
                  textPosition={textPosition}
                  colorPalette={colorPalette}
                  otherColors={otherColors}
                  onTitleChange={onTitleChange}
                  onSubTitleChange={onSubTitleChange}
                  onTitleStyleChange={onTitleStyleChange}
                  onSubTitleStyleChange={onSubTitleStyleChange}
                  onTextOrientationChange={onTextOrientationChange}
                  onTextPositionChange={onTextPositionChange}
                  onUpdateColorList={setOtherColors}
                  onUpdateColorPalette={setColorPalette}
                  bottomSheetHeights={bottomSheetHeights}
                  style={{ flex: 1 }}
                />
              ),
            },
            {
              id: 'foreground',
              element: (
                <CECForegroundPanel
                  viewer={viewer}
                  foreground={foreground?.id}
                  foregroundColor={foregroundColor}
                  colorPalette={colorPalette}
                  otherColors={otherColors}
                  onForegroundChange={onForegroundChange}
                  onForegroundColorChange={onForegroundColorChange}
                  onUpdateColorList={setOtherColors}
                  onUpdateColorPalette={setColorPalette}
                  bottomSheetHeights={bottomSheetHeights}
                  style={{ flex: 1 }}
                />
              ),
            },
            {
              id: 'background',
              element: (
                <CoverEditorCustomBackgroundPanel
                  viewer={viewer}
                  background={background?.id}
                  backgroundColor={backgroundColor}
                  backgroundPatternColor={backgroundPatternColor}
                  colorPalette={colorPalette}
                  otherColors={otherColors}
                  onBackgroundChange={onBackgroundChange}
                  onBackgroundColorChange={onBackgroundColorChange}
                  onBackgroundPatternColorChange={
                    onBackgroundPatternColorChange
                  }
                  onUpdateColorList={setOtherColors}
                  onUpdateColorPalette={setColorPalette}
                  bottomSheetHeights={bottomSheetHeights}
                  style={{ flex: 1 }}
                />
              ),
            },
          ]}
        />
        <CoverEditorCustomBottomMenu
          currentTab={currentTab}
          onItemPress={navigateToPanel}
          style={[
            styles.tabsBar,
            { bottom: insetBottom, width: windowWidth - 20 },
          ]}
        />
        {editedParameter != null && (
          <Container
            style={[
              {
                position: 'absolute',
                bottom: 0,
                paddingBottom: insetBottom,
                width: windowWidth,
                height: bottomPanelHeight - 10,
              },
            ]}
          >
            <ImageEditionParameterControl
              value={editionParameters?.[editedParameter] as any}
              parameter={editedParameter}
              onChange={onEditedParameterValueChange}
              style={{ flex: 1 }}
            />
            <ImageEditionFooter
              onSave={onParameterEditionSave}
              onCancel={onParameterEditionCancel}
            />
          </Container>
        )}
      </KeyboardAvoidingView>
      <ScreenModal visible={showImagePicker} animationType="slide">
        <CoverEditiorImagePicker
          kind="mixed"
          onFinished={onMediaSelected}
          onCancel={closeImagePicker}
        />
      </ScreenModal>
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
    </Container>
  );
};

export default CoverEditorCustom;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardAvoidingView: {
    width: '100%',
    height: '100%',
  },
  topPanel: {
    alignItems: 'center',
    paddingTop: TOP_PANEL_PADDING,
    rowGap: TOP_PANEL_GAP,
  },
  tabsBar: {
    position: 'absolute',
    left: 10,
    right: 10,
  },
});
