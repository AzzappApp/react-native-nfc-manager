import { useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { formatDuration } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { useEditionParametersDisplayInfos } from '#components/gpu';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
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
import type { EditionParameters, ImageOrientation } from '#components/gpu';
import type { FooterBarItem } from '#ui/FooterBar';
import type { MediaVideo } from './imagePickerTypes';
/**
 * A step of the Image Picker that allows the user to edit the selected image
 * (crop, filter, brightness, contrast etc.)
 */
const EditImageStep = () => {
  const {
    maxVideoDuration,
    media,
    aspectRatio,
    editionParameters,
    timeRange,
    mediaFilter,
    onMediaFilterChange,
    onTimeRangeChange,
    onEditionParametersChange,
    onParameterValueChange,
  } = useImagePickerState();

  const previousParameters = useRef(editionParameters);
  const previousTimeRange = useRef(timeRange);
  const [editedParameter, setEditedParam] = useState<
    keyof EditionParameters | null
  >(null);
  const [currentTab, setCurrentTab] = useState<'edit' | 'filter' | 'timeRange'>(
    'filter',
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
  }, [editionParameters, timeRange]);

  const onEditionCancel = useCallback(() => {
    onEditionParametersChange(previousParameters.current);
    onTimeRangeChange(previousTimeRange.current);
    setEditedParam(null);
  }, [onEditionParametersChange, onTimeRangeChange]);

  const onCurrentParamChange = useCallback(
    (value: number) => {
      onParameterValueChange(editedParameter!, value);
    },
    [editedParameter, onParameterValueChange],
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

  const tabs = useMemo<FooterBarItem[]>(() => {
    const tabs: FooterBarItem[] = [
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
    return tabs;
  }, [intl, media?.kind]);

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
                  <Text
                    variant="xsmall"
                    style={{ width: 25, fontSize: 10, color: 'white' }}
                  >
                    {formatDuration(media.duration)}
                  </Text>
                </View>
              )}
              {timeRange &&
                timeRange?.duration < media.duration &&
                !(media.duration > maxVideoDuration) && (
                  <View style={[styles.durationView]}>
                    <Text
                      variant="xsmall"
                      style={{ width: 25, fontSize: 10, color: 'white' }}
                    >
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
                <Text
                  variant="xsmall"
                  style={{ width: 25, fontSize: 10, color: 'white' }}
                >
                  {formatDuration(timeRange?.duration ?? media.duration)}
                </Text>
              </View>
            </View>
          )}
        </ImagePickerMediaRenderer>
      }
      bottomPanel={({ insetBottom }) =>
        editedParameter === null ? (
          <View
            style={{
              flex: 1,
              marginTop: 20,
              marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
            }}
          >
            {currentTab === 'filter' && (
              <TitleWithLine
                title={intl.formatMessage({
                  defaultMessage: 'Filters',
                  description:
                    'Title of the filters section in Image edition wizzard',
                })}
              />
            )}
            {currentTab === 'edit' && (
              <TitleWithLine
                title={intl.formatMessage({
                  defaultMessage: 'Adjust',
                  description:
                    'Title of the adjust section in Image edition wizzard',
                })}
              />
            )}
            {currentTab === 'timeRange' && (
              <TitleWithLine
                title={intl.formatMessage({
                  defaultMessage: 'Cut Video',
                  description:
                    'Title of the cut video section in Image edition wizzar',
                })}
              />
            )}
            <View style={styles.contentContainer}>
              {currentTab === 'filter' && (
                <FilterSelectionList
                  layer={
                    media?.kind === 'image'
                      ? {
                          kind: 'image',
                          uri: media.uri,
                          parameters: editionParameters,
                        }
                      : {
                          kind: 'videoFrame',
                          uri: media!.uri,
                          parameters: editionParameters,
                        }
                  }
                  aspectRatio={aspectRatio}
                  selectedFilter={mediaFilter}
                  onChange={onMediaFilterChange}
                  contentContainerStyle={styles.filterSelectionContentContainer}
                  style={styles.filterSelectionStyle}
                />
              )}
              {currentTab === 'edit' && (
                <ImageEditionParametersList
                  style={styles.filterSelectionStyle}
                  contentContainerStyle={styles.filterSelectionContentContainer}
                  onSelectParam={onEditionStart}
                />
              )}
              {currentTab === 'timeRange' && (
                <VideoTimelineEditor
                  video={media as MediaVideo}
                  editionParameters={editionParameters}
                  aspectRatio={aspectRatio}
                  maxDuration={maxVideoDuration}
                  onChange={onTimeRangeChange}
                  width={windowWidth - 30}
                  imagesHeight={50}
                  style={styles.videoTimelineEditor}
                  timeRange={timeRange}
                />
              )}
            </View>
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
            }}
          >
            {editedParameter === 'cropData' ? (
              <ImageEditionParameterControl
                value={editionParameters.roll}
                parameter="roll"
                onChange={value => onParameterValueChange('roll', value)}
                style={styles.filterSelectionStyle}
              />
            ) : (
              <ImageEditionParameterControl
                value={editionParameters[editedParameter] as any}
                parameter={editedParameter}
                onChange={onCurrentParamChange}
                style={styles.filterSelectionStyle}
              />
            )}
            <ImageEditionFooter
              onSave={onEditionSave}
              onCancel={onEditionCancel}
            />
          </View>
        )
      }
      menuBarProps={
        !isEditing
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
    flex: 1,
    flexShrink: 0,
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
  filterSelectionContentContainer: {
    paddingHorizontal: 20,
    maxHeight: 113,
    alignSelf: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    paddingHorizontal: 25,
    backgroundColor: 'white',
    zIndex: 1,
  },
  titleLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    width: '100%',
    height: 1,
    backgroundColor: 'colors.grey50',
    transform: [{ translateY: -0.5 }],
  },
  contentContainer: {
    flex: 1,
    marginTop: 10,
    justifyContent: 'flex-start',
  },
});
