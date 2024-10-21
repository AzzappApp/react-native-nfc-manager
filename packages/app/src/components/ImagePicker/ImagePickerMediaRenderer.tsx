import isEqual from 'lodash/isEqual';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { colors } from '#theme';
import Cropper from '#components/Cropper';
import TransformedImageRenderer from '#components/TransformedImageRenderer';
import TransformedVideoRenderer from '#components/TransformedVideoRenderer';
import {
  scaleCropDataIfNecessary,
  type CropData,
} from '#helpers/mediaEditions';
import { useImagePickerState } from './ImagePickerContext';
import type { LayoutChangeEvent } from 'react-native';

type ImagePickerMediaRendererProps = {
  /**
   * if true, the crop edition mode is enabled
   */
  cropEditionMode?: boolean;
  /**
   * element to display alongside the media
   * (e.g. a button to change the aspect ratio)
   *
   * It is useful to display buttons in image picker top panel without
   * changing the component hierarchy (to avoid re-mounting the media)
   */
  children?: React.ReactNode;
};

/**
 * Render the selected media of the ImagePicker
 */
const ImagePickerMediaRenderer = ({
  cropEditionMode,
  children,
}: ImagePickerMediaRendererProps) => {
  const {
    media,
    aspectRatio,
    skImage,
    editionParameters,
    timeRange,
    mediaFilter,
    exporting,
    onParameterValueChange,
  } = useImagePickerState();

  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions(dimensions =>
      isEqual(dimensions, { width, height }) ? dimensions : { width, height },
    );
  }, []);

  const imageDimensions = useMemo(() => {
    if (!dimensions) {
      return null;
    }

    return aspectRatio > 1
      ? { width: dimensions.width, height: dimensions.width / aspectRatio }
      : { width: dimensions.height * aspectRatio, height: dimensions.height };
  }, [aspectRatio, dimensions]);

  const onCropDataChange = useCallback(
    (cropData: CropData) => onParameterValueChange('cropData', cropData),
    [onParameterValueChange],
  );

  const cropperStyle = useMemo(() => {
    return { ...imageDimensions, backgroundColor: 'black' };
  }, [imageDimensions]);

  const { width: windowWidth } = useWindowDimensions();

  const [skImageWidth, setSkImageWidth] = useState<number | null>(null);

  useAnimatedReaction(
    () => skImage.value,
    skImage => {
      if (skImage) {
        runOnJS(setSkImageWidth)(skImage.width());
      } else {
        runOnJS(setSkImageWidth)(null);
      }
    },
  );

  if (!media) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {imageDimensions && (
        <>
          <Cropper
            // avoid unwanted transition effect when changing media or aspect ratio
            key={`${media.uri}-${aspectRatio}`}
            cropEditionMode={cropEditionMode}
            mediaSize={media}
            aspectRatio={aspectRatio}
            cropData={editionParameters.cropData}
            roll={editionParameters.roll}
            orientation={editionParameters.orientation}
            onCropDataChange={onCropDataChange}
            style={cropperStyle}
          >
            {cropData =>
              media.kind === 'image' || exporting ? (
                <TransformedImageRenderer
                  testID="image-picker-media-image"
                  image={skImage}
                  {...imageDimensions}
                  filter={mediaFilter}
                  editionParameters={{
                    ...editionParameters,
                    cropData: scaleCropDataIfNecessary(
                      cropData,
                      media,
                      skImageWidth,
                    ),
                  }}
                />
              ) : (
                <TransformedVideoRenderer
                  testID="image-picker-media-video"
                  video={media}
                  {...imageDimensions}
                  filter={mediaFilter}
                  editionParameters={{ ...editionParameters, cropData }}
                  startTime={timeRange?.startTime ?? 0}
                  duration={timeRange?.duration ?? 15}
                  maxResolution={windowWidth * 2}
                />
              )
            }
          </Cropper>
          {children}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grey500,
  },
});

export default ImagePickerMediaRenderer;
