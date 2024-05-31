import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Dimensions, StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import {
  DoneHeaderButton,
  ResetHeaderButton,
} from '#components/commonsButtons';
import ImageEditionFooter from '#components/ImageEditionFooter';
import ImageEditionParameterControl from '#components/ImageEditionParameterControl';
import ImageEditionParametersList from '#components/ImageEditionParametersList';
import ScreenModal from '#components/ScreenModal';
import TransformedImageRenderer from '#components/TransformedImageRenderer';
import TransformedVideoRenderer from '#components/TransformedVideoRenderer';
import {
  editionParametersSettings,
  useEditionParametersDisplayInfos,
  useSkImage,
  type EditionParameters,
} from '#helpers/mediaEditions';
import useToggle from '#hooks/useToggle';
import Header from '#ui/Header';
import SafeAreaView from '#ui/SafeAreaView';
import ToolBoxSection from '#ui/ToolBoxSection';
import {
  useCoverEditorActiveMedia,
  useCoverEditorContext,
} from '../CoverEditorContext';
import type { MediaInfoVideo } from '../coverEditorTypes';

const CoverEditorAdjustTool = () => {
  const intl = useIntl();
  const [show, toggleScreenModal] = useToggle(false);
  const paramsInfos = useEditionParametersDisplayInfos();
  const { dispatch } = useCoverEditorContext();

  const activeMedia = useCoverEditorActiveMedia();

  useEffect(() => {
    if (activeMedia?.editionParameters) {
      setCurrentEditionParameters({
        ...activeMedia?.editionParameters,
        cropData: null,
      });
    }
  }, [activeMedia?.editionParameters]);

  const [currentEditionParameters, setCurrentEditionParameters] =
    useState<EditionParameters>({});

  const dimensions = useMemo(() => {
    if (!activeMedia?.media) {
      return null;
    }
    //from Nico, we are always showing the full image without crop or resize to apply edition parameters
    const aspectRatio = activeMedia.media.width / activeMedia.media.height;

    return aspectRatio > 1
      ? { width: windowsWidth, height: windowsWidth / aspectRatio }
      : { width: windowsWidth * aspectRatio, height: windowsWidth };
  }, [activeMedia?.media]);

  const skImage = useSkImage({
    uri: activeMedia?.media.uri,
    kind: activeMedia?.media.kind,
    time:
      activeMedia?.media.kind === 'video'
        ? (activeMedia as MediaInfoVideo).timeRange?.startTime
        : 0,
  });

  //#region Data manamgement
  //current edition parameters that can be reset to the context one

  // the parameter to edit
  const [selectedparameter, setSelectedParameter] = useState<
    keyof EditionParameters | null
  >(null);

  // reset the current edition parameters to the context one
  const onReset = useCallback(() => {
    setCurrentEditionParameters({
      cropData: null,
    });
  }, []);

  //save the current modified parameters to be able to cancel on second layer (by each value). Lazy to save all the parameters that the selected value
  const previousParametersValue = useRef(currentEditionParameters);
  const onSelectEditionParamter = useCallback(
    (param: keyof EditionParameters) => {
      setSelectedParameter(param);
      previousParametersValue.current = currentEditionParameters;
    },
    [currentEditionParameters],
  );

  const onCurrentParamChange = useCallback(
    (value: number) => {
      if (selectedparameter) {
        setCurrentEditionParameters(prev => ({
          ...prev,
          [selectedparameter]: value,
        }));
      }
    },
    [selectedparameter],
  );

  const onCancelParamChange = useCallback(() => {
    if (selectedparameter) {
      setCurrentEditionParameters(previousParametersValue.current);
    }
    setSelectedParameter(null);
  }, [selectedparameter]);

  const onSave = useCallback(() => {
    dispatch({
      type: 'UPDATE_MEDIA_EDITION_PARAMETERS',
      payload: {
        ...currentEditionParameters,
        cropData: activeMedia?.editionParameters?.cropData ?? null,
      },
    });
    toggleScreenModal();
  }, [
    activeMedia?.editionParameters?.cropData,
    currentEditionParameters,
    dispatch,
    toggleScreenModal,
  ]);

  return (
    <>
      <ToolBoxSection
        icon="settings"
        label={intl.formatMessage({
          defaultMessage: 'Adjust',
          description: 'Cover Edition Overlay Tool Button - Adjust',
        })}
        onPress={toggleScreenModal}
      />
      {activeMedia != null && (
        <ScreenModal visible={show} animationType="slide">
          <SafeAreaView style={styles.containerPanel}>
            <Header
              leftElement={
                !selectedparameter && <ResetHeaderButton onPress={onReset} />
              }
              middleElement={
                selectedparameter
                  ? paramsInfos[selectedparameter]?.label
                  : intl.formatMessage({
                      defaultMessage: 'Adjust',
                      description: 'CoverEdition Adjust Tool - Header Title',
                    })
              }
              rightElement={
                !selectedparameter && <DoneHeaderButton onPress={onSave} />
              }
            />
            {dimensions && (
              <View style={styles.imageContainer}>
                {activeMedia.media.kind === 'video' ? (
                  <TransformedVideoRenderer
                    testID="image-picker-media-video"
                    video={activeMedia.media}
                    {...dimensions}
                    filter={activeMedia.filter}
                    editionParameters={currentEditionParameters}
                    startTime={
                      (activeMedia as MediaInfoVideo).timeRange?.startTime ?? 0
                    }
                    duration={
                      (activeMedia as MediaInfoVideo).timeRange?.duration ?? 15
                    }
                  />
                ) : (
                  <TransformedImageRenderer
                    testID="image-picker-media-image"
                    image={skImage}
                    {...dimensions}
                    filter={activeMedia.filter}
                    editionParameters={currentEditionParameters}
                  />
                )}
              </View>
            )}
            <View style={styles.containerPanel}>
              {!selectedparameter && (
                <ImageEditionParametersList
                  style={styles.filterSelectionStyle}
                  contentContainerStyle={styles.editImageStepContentContainer}
                  onSelectParam={onSelectEditionParamter}
                  excludedParams={['cropData']}
                />
              )}
              {selectedparameter && (
                <>
                  <ImageEditionParameterControl
                    value={currentEditionParameters[selectedparameter] as any}
                    parameterSettings={
                      editionParametersSettings[selectedparameter]
                    }
                    onChange={onCurrentParamChange}
                    style={styles.filterSelectionStyle}
                  />
                  <ImageEditionFooter
                    onSave={() => setSelectedParameter(null)}
                    onCancel={onCancelParamChange}
                  />
                </>
              )}
            </View>
          </SafeAreaView>
        </ScreenModal>
      )}
    </>
  );
};

export default CoverEditorAdjustTool;
const windowsWidth = Dimensions.get('window').width;
const styles = StyleSheet.create({
  containerPanel: { flex: 1 },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grey500,
    marginTop: 20,
  },
  filterSelectionStyle: { flex: 1, flexShrink: 0 },
  editImageStepContentContainer: {
    paddingHorizontal: 20,
    maxHeight: 113,
    alignSelf: 'center',
  },
});
