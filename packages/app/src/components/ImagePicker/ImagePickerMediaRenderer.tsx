import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import Cropper from '#components/Cropper';
import {
  GPUImageView,
  GPUVideoView,
  Image,
  Video,
  VideoFrame,
} from '#components/gpu';
import { useImagePickerState } from './ImagePickerContext';

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
    editionParameters,
    timeRange,
    mediaFilter,
    exporting,
    onParameterValueChange,
  } = useImagePickerState();

  if (!media) {
    return null;
  }

  if (Platform.OS === 'android' && exporting && media.kind === 'video') {
    // Displaying edited video and exporting is too much for android
    const sizeStyles =
      aspectRatio > 1
        ? ({ aspectRatio, width: '100%' } as const)
        : ({ aspectRatio, height: '100%' } as const);

    return (
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={[
            sizeStyles,
            { alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <GPUImageView style={StyleSheet.absoluteFill}>
            <VideoFrame uri={media.uri} parameters={editionParameters} />
          </GPUImageView>
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0,0, 0, 0.4)' },
            ]}
          />
          <ActivityIndicator size="large" color="white" />
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.grey500,
      }}
    >
      <Cropper
        // avoid unwanted transition effect when changing media or aspect ratio
        key={`${media.uri}-${aspectRatio}`}
        cropEditionMode={cropEditionMode}
        mediaSize={media}
        aspectRatio={aspectRatio}
        cropData={editionParameters.cropData}
        pitch={editionParameters.pitch}
        roll={editionParameters.roll}
        yaw={editionParameters.yaw}
        orientation={editionParameters.orientation}
        onCropDataChange={cropData =>
          onParameterValueChange('cropData', cropData)
        }
        style={{
          width: aspectRatio >= 1 ? '100%' : 'auto',
          height: aspectRatio <= 1 ? '100%' : 'auto',
          aspectRatio,
          backgroundColor: 'black',
        }}
      >
        {cropData =>
          media.kind === 'image' ? (
            <GPUImageView
              style={{ flex: 1, aspectRatio }}
              testID="image-picker-media-image"
            >
              <Image
                uri={media.uri}
                parameters={{ ...editionParameters, cropData }}
                filters={mediaFilter ? [mediaFilter] : null}
              />
            </GPUImageView>
          ) : (
            <GPUVideoView
              style={{ flex: 1, aspectRatio }}
              testID="image-picker-media-video"
            >
              <Video
                uri={media.uri}
                parameters={{ ...editionParameters, cropData }}
                filters={mediaFilter ? [mediaFilter] : null}
                startTime={timeRange?.startTime}
                duration={timeRange?.duration}
              />
            </GPUVideoView>
          )
        }
      </Cropper>
      {children}
    </View>
  );
};

export default ImagePickerMediaRenderer;
