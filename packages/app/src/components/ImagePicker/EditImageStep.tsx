import { useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import { formatDuration } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import {
  editionParametersSettings,
  useEditionParametersDisplayInfos,
  preloadLUTShaders,
} from '#helpers/mediaEditions';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import TabView from '#ui/TabView';
import Text from '#ui/Text';
import TitleWithLine from '#ui/TitleWithLine';
import FilterSelectionList from '../FilterSelectionList';
import ImageEditionFooter from '../ImageEditionFooter';
import ImageEditionParameterControl from '../ImageEditionParameterControl';
import ImageEditionParametersList from '../ImageEditionParametersList';
import VideoTimelineEditor from '../VideoTimelineEditor';
import { useImagePickerState } from './ImagePickerContext';
import ImagePickerMediaRenderer from './ImagePickerMediaRenderer';
import { ImagePickerStep } from './ImagePickerWizardContainer';
import type {
  EditionParameters,
  ImageOrientation,
} from '#helpers/mediaEditions';
import type { BottomMenuItem } from '#ui/BottomMenu';

type EditImageStepProps = {
  selectedTab?: 'edit' | 'filter' | 'timeRange';
  selectedParameter?: keyof EditionParameters | null;
  showTabs?: boolean;
  onEditionSave?: (editionParameters: EditionParameters) => void;
  onEditionCancel?: () => void;
};

/**
 * A step of the Image Picker that allows the user to edit the selected image
 * (crop, filter, brightness, contrast etc.)
 */
const EditImageStep = ({
  selectedTab,
  showTabs = true,
  selectedParameter = null,
  onEditionSave: onEditionSaveProp,
  onEditionCancel: onEditionCancelProp,
}: EditImageStepProps) => {
  const {
    minVideoDuration,
    maxVideoDuration,
    media,
    aspectRatio,
    skImage,
    editionParameters,
    timeRange,
    mediaFilter,
    onMediaFilterChange,
    onTimeRangeChange,
    onEditionParametersChange,
    onParameterValueChange,
    isSkImageReady,
  } = useImagePickerState();

  const previousParameters = useRef(editionParameters);
  const previousTimeRange = useRef(timeRange);
  const [editedParameter, setEditedParam] = useState<
    keyof EditionParameters | null
  >(selectedParameter ?? null);
  const [currentTab, setCurrentTab] = useState<'edit' | 'filter' | 'timeRange'>(
    selectedTab ?? 'filter',
  );

  const onEditionStart = useCallback(
    (param: keyof EditionParameters) => {
      previousParameters.current = editionParameters;
      previousTimeRange.current = timeRange;
      setEditedParam(param);
    },
    [editionParameters, timeRange],
  );

  const onEditionSave = useCallback(() => {
    previousParameters.current = editionParameters;
    previousTimeRange.current = timeRange;
    setEditedParam(null);
    onEditionSaveProp?.(editionParameters);
  }, [editionParameters, onEditionSaveProp, timeRange]);

  const onEditionCancel = useCallback(() => {
    onEditionParametersChange(previousParameters.current);
    onTimeRangeChange(previousTimeRange.current);
    setEditedParam(null);
    onEditionCancelProp?.();
  }, [onEditionParametersChange, onEditionCancelProp, onTimeRangeChange]);

  const onCurrentParamChange = useCallback(
    (value: number) => {
      onParameterValueChange(editedParameter!, value);
    },
    [editedParameter, onParameterValueChange],
  );

  const onDebouncedCurrentParamChange = useDebouncedCallback(
    onCurrentParamChange,
    50,
    { trailing: true },
  );

  const onNextOrientation = useCallback(() => {
    let nextOrientation: ImageOrientation;
    switch (editionParameters.orientation) {
      case 'LEFT':
        nextOrientation = 'DOWN';
        break;
      case 'DOWN':
        nextOrientation = 'RIGHT';
        break;
      case 'RIGHT':
        nextOrientation = 'UP';
        break;
      case 'UP':
      default:
        nextOrientation = 'LEFT';
        break;
    }
    onParameterValueChange('orientation', nextOrientation);
  }, [editionParameters.orientation, onParameterValueChange]);

  const intl = useIntl();
  const { width: windowWidth } = useWindowDimensions();
  const isEditing = !!editedParameter;
  const paramsInfos = useEditionParametersDisplayInfos();

  const tabs = useMemo<BottomMenuItem[]>(() => {
    let tabs: BottomMenuItem[] = [
      {
        icon: 'filters',
        key: 'filter',
        label: intl.formatMessage({
          defaultMessage: 'Filter',
          description:
            'Accessibility label of the Filter tab in image editing view',
        }),
      },
      {
        icon: 'settings',
        key: 'edit',
        label: intl.formatMessage({
          defaultMessage: 'Adjust',
          description:
            'Accessibility label of the Adjust tab in image editing view',
        }),
      },
    ];
    if (media?.kind === 'video') {
      tabs.push({
        icon: 'chrono',
        key: 'timeRange',
        label: intl.formatMessage({
          defaultMessage: 'Cut Video',
          description:
            'Accessibility label of the Cut Video tab in image picking wizzard',
        }),
      });
    }
    if (!showTabs) {
      tabs = tabs.filter(tab => tab.key === currentTab);
    }
    return tabs;
  }, [currentTab, intl, media?.kind, showTabs]);

  return (
    <ImagePickerStep
      stepId={EditImageStep.STEP_ID}
      headerTitle={editedParameter ? paramsInfos[editedParameter]?.label : null}
      headerRightButton={
        editedParameter === 'cropData' ? (
          <IconButton
            icon="rotate"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Rotate',
              description:
                'Accessibility label of the rotate button in image edition wizzard',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage:
                'Rotate the image by 90° clockwise. This will change the crop area.',
              description:
                'Accessibility hint of the rotate button in image edition wizzard',
            })}
            onPress={onNextOrientation}
          />
        ) : null
      }
      preventNavigation={isEditing}
      topPanel={
        <ImagePickerMediaRenderer
          cropEditionMode={editedParameter === 'cropData'}
        >
          {media?.kind === 'video' && (
            <View style={styles.viewVideoDurationError}>
              {media.duration > maxVideoDuration && (
                <View style={[styles.durationView, styles.viewIconDuration]}>
                  <Text variant="xsmall" style={styles.duration}>
                    {formatDuration(media.duration)}
                  </Text>
                </View>
              )}
              {timeRange &&
                timeRange?.duration < media.duration &&
                !(media.duration > maxVideoDuration) && (
                  <View style={[styles.durationView]}>
                    <Text variant="xsmall" style={styles.duration}>
                      {formatDuration(media.duration)}
                    </Text>
                  </View>
                )}
              {(media.duration > maxVideoDuration ||
                (timeRange && timeRange?.duration < media.duration)) && (
                <Icon
                  icon="arrow_right"
                  style={{ tintColor: colors.white, width: 18, height: 18 }}
                />
              )}
              <View style={styles.durationView}>
                <Text variant="xsmall" style={styles.duration}>
                  {formatDuration(timeRange?.duration ?? media.duration)}
                </Text>
              </View>
            </View>
          )}
        </ImagePickerMediaRenderer>
      }
      bottomPanel={({ insetBottom }) => (
        <TabView
          currentTab={editedParameter ? 'edit-parameter' : currentTab}
          style={{
            flex: 1,
            marginTop: 20,
            marginBottom: insetBottom + BOTTOM_MENU_HEIGHT + 15,
          }}
          mountOnlyCurrentTab
          tabs={[
            {
              id: 'filter',
              element: (
                <>
                  <TitleWithLine
                    title={intl.formatMessage({
                      defaultMessage: 'Filters',
                      description:
                        'Title of the filters section in Image edition wizzard',
                    })}
                  />
                  <View style={styles.contentContainer}>
                    <FilterSelectionList
                      isSkImageReady={isSkImageReady}
                      skImage={skImage}
                      media={media}
                      aspectRatio={aspectRatio}
                      cropData={editionParameters.cropData}
                      orientation={editionParameters.orientation}
                      selectedFilter={mediaFilter}
                      onChange={onMediaFilterChange}
                      style={styles.filterSelectionStyle}
                    />
                  </View>
                </>
              ),
            },
            {
              id: 'edit',
              element: (
                <>
                  <TitleWithLine
                    title={intl.formatMessage({
                      defaultMessage: 'Adjust',
                      description:
                        'Title of the adjust section in Image edition wizzard',
                    })}
                  />
                  <ImageEditionParametersList
                    style={styles.filterSelectionStyle}
                    contentContainerStyle={styles.editImageStepContentContainer}
                    onSelectParam={onEditionStart}
                  />
                </>
              ),
            },
            {
              id: 'timeRange',
              element:
                media?.kind === 'video' ? (
                  <>
                    <TitleWithLine
                      title={intl.formatMessage({
                        defaultMessage: 'Cut Video',
                        description:
                          'Title of the cut video section in Image edition wizzar',
                      })}
                    />
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <VideoTimelineEditor
                        video={media}
                        aspectRatio={aspectRatio}
                        maxDuration={maxVideoDuration}
                        minDuration={minVideoDuration}
                        onChange={onTimeRangeChange}
                        width={windowWidth - 30}
                        imagesHeight={50}
                        style={styles.videoTimelineEditor}
                        timeRange={timeRange}
                      />
                    </View>
                  </>
                ) : (
                  <></>
                ),
            },
            {
              id: 'edit-parameter',
              element: (
                <>
                  {editedParameter === 'cropData' ? (
                    <ImageEditionParameterControl
                      value={editionParameters.roll}
                      parameterSettings={editionParametersSettings.roll}
                      label={intl.formatMessage({
                        defaultMessage: 'rotate:',
                        description: 'Image roll parameter label',
                      })}
                      labelSuffix="°"
                      onChange={value => onParameterValueChange('roll', value)}
                      style={styles.filterSelectionStyle}
                    />
                  ) : editedParameter ? (
                    <ImageEditionParameterControl
                      value={editionParameters[editedParameter] as any}
                      parameterSettings={
                        editionParametersSettings[editedParameter]
                      }
                      onChange={onDebouncedCurrentParamChange}
                      style={styles.filterSelectionStyle}
                    />
                  ) : null}
                  <ImageEditionFooter
                    onSave={onEditionSave}
                    onCancel={onEditionCancel}
                  />
                </>
              ),
            },
          ]}
        />
      )}
      menuBarProps={
        !isEditing && showTabs
          ? {
              currentTab,
              onItemPress: setCurrentTab as any,
              tabs,
            }
          : null
      }
    />
  );
};

EditImageStep.STEP_ID = 'EDIT_IMAGE';
EditImageStep.preload = () => preloadLUTShaders();

export default EditImageStep;

const styles = StyleSheet.create({
  durationView: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  videoTimelineEditor: {
    alignSelf: 'center',
    maxHeight: 113,
    marginTop: 30,
  },
  viewIconDuration: {
    backgroundColor: colors.red400,
  },
  viewVideoDurationError: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSelectionStyle: { flex: 1, flexShrink: 0 },
  editImageStepContentContainer: {
    paddingHorizontal: 20,
    maxHeight: 113,
    alignSelf: 'center',
  },
  contentContainer: {
    flex: 1,
    marginTop: 10,
    justifyContent: 'flex-start',
  },
  duration: { fontSize: 10, color: colors.white },
});
