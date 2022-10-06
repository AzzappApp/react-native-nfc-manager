import { useCallback, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, textStyles } from '../../../theme';
import IconButton from '../../ui/IconButton';
import { TAB_BAR_HEIGHT } from '../../ui/TabsBar';
import EditionFooter from './EditionFooter';
import FilterSelectionList from './FilterSelectionList';
import {
  TOOL_BAR_BOTTOM_MARGIN,
  useEditionParametersDisplayInfos,
} from './helpers';
import { useImagePickerState } from './ImagePickerContext';
import { ImagePickerStep } from './ImagePickerWizardContainer';
import ParamEditor from './ParameterEditor';
import ParametersList from './ParametersList';
import VideoEditor from './VideoEditor';
import WizardImageEditor from './WizardImagEditor';
import type { Tab } from '../../ui/TabsBar';
import type {
  Video,
  ImageEditionParameters,
  ImageOrientation,
} from './helpers';

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
    keyof ImageEditionParameters | null
  >(null);
  const [currentTab, setCurrentTab] = useState<'edit' | 'filter' | 'timeRange'>(
    'filter',
  );

  const onEditionStart = useCallback(
    (param: keyof ImageEditionParameters) => {
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
      case 'RIGHT':
        nextOrientation = 'DOWN';
        break;
      case 'DOWN':
        nextOrientation = 'LEFT';
        break;
      case 'LEFT':
        nextOrientation = 'UP';
        break;
      case 'UP':
      default:
        nextOrientation = 'RIGHT';
        break;
    }
    onParameterValueChange('orientation', nextOrientation);
  }, [editionParameters.orientation, onParameterValueChange]);

  const intl = useIntl();
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const isEditing = !!editedParameter;
  const paramsInfos = useEditionParametersDisplayInfos();

  const tabs = useMemo<Tab[]>(() => {
    const tabs: Tab[] = [
      {
        icon: 'magic',
        key: 'filter',
        accessibilityLabel: intl.formatMessage({
          defaultMessage: 'Media Filter',
          description:
            'Accessibility label of the Media filter tabs in image editing view',
        }),
      },
      {
        icon: 'parameters',
        key: 'edit',
        accessibilityLabel: intl.formatMessage({
          defaultMessage: 'Media Filter',
          description:
            'Accessibility label of the Media filter tabs in image editing view',
        }),
      },
    ];
    if (media?.kind === 'video') {
      tabs.push({
        icon: 'clock',
        key: 'timeRange',
        accessibilityLabel: intl.formatMessage({
          defaultMessage: 'Take a video',
          description:
            'Accessibility label of the video tabs in post  in image picking wizzard',
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
        editedParameter === 'cropData' && media?.kind === 'image' ? (
          <IconButton icon="rotate" onPress={onNextOrientation} />
        ) : null
      }
      preventNavigation={isEditing}
      topPanel={
        <WizardImageEditor cropEditionMode={editedParameter === 'cropData'} />
      }
      bottomPanel={
        editedParameter === null ? (
          <>
            <View style={styles.titleContainer}>
              <View style={styles.titleLine} />
              <Text style={[textStyles.title, styles.title]}>
                {currentTab === 'filter' && (
                  <FormattedMessage
                    defaultMessage="Filter"
                    description="Title of the filter section in Image edition wizzard"
                  />
                )}
                {currentTab === 'edit' && (
                  <FormattedMessage
                    defaultMessage="Adjust"
                    description="Title of the adjust section in Image edition wizzard"
                  />
                )}
                {currentTab === 'timeRange' && (
                  <FormattedMessage
                    defaultMessage="Cut Video"
                    description="Title of the cut video section in Image edition wizzard"
                  />
                )}
              </Text>
            </View>
            <View
              style={[
                styles.contentContainer,
                {
                  marginBottom:
                    TAB_BAR_HEIGHT + safeAreaBottom + TOOL_BAR_BOTTOM_MARGIN,
                },
              ]}
            >
              {currentTab === 'filter' && (
                <FilterSelectionList
                  media={media!}
                  editionParameters={editionParameters}
                  aspectRatio={aspectRatio}
                  selectedFilter={mediaFilter}
                  onChange={onMediaFilterChange}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                  style={{ flex: 1, maxHeight: 120 }}
                />
              )}
              {currentTab === 'edit' && (
                <ParametersList
                  style={{ flexGrow: 0 }}
                  onSelectParam={onEditionStart}
                />
              )}
              {currentTab === 'timeRange' && (
                <VideoEditor
                  media={media as Video}
                  editionParameters={editionParameters}
                  aspectRatio={aspectRatio}
                  maxDuration={maxVideoDuration}
                  onChange={onTimeRangeChange}
                  width={windowWidth - 20}
                  imagesHeight={80}
                  style={{ alignSelf: 'center' }}
                />
              )}
            </View>
          </>
        ) : (
          <View
            style={{
              flex: 1,
              marginBottom: safeAreaBottom,
              paddingVertical: 10,
            }}
          >
            {editedParameter === 'cropData' ? (
              media?.kind === 'image' ? (
                <ParamEditor
                  value={editionParameters.roll}
                  parameter="roll"
                  onChange={value => onParameterValueChange('roll', value)}
                  style={{ flex: 1 }}
                />
              ) : (
                <View style={{ flex: 1 }} />
              )
            ) : (
              <ParamEditor
                value={editionParameters[editedParameter] as any}
                parameter={editedParameter}
                onChange={onCurrentParamChange}
                style={{ flex: 1 }}
              />
            )}
            <EditionFooter onSave={onEditionSave} onCancel={onEditionCancel} />
          </View>
        )
      }
      toolbarProps={
        !isEditing
          ? {
              currentTab,
              onTabPress: setCurrentTab as any,
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
    backgroundColor: colors.grey50,
    transform: [{ translateY: -0.5 }],
  },
  contentContainer: {
    flex: 1,
    marginVertical: 10,
    justifyContent: 'center',
  },
});

export const parametersList: Array<keyof ImageEditionParameters> = [
  'cropData',
  'brightness',
  'contrast',
  'highlights',
  'saturation',
  'shadow',
  'sharpness',
  'structure',
  'temperature',
  'tint',
  'vibrance',
  'vigneting',
];
