import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import {
  EditableImageWithCropMode,
  EditableVideoWithCropMode,
  EditableImage,
} from '../medias';
import { useImagePickerState } from './ImagePickerContext';

const ImagePickerMediaRenderer = ({
  cropEditionMode,
}: {
  cropEditionMode?: boolean;
}) => {
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
        ? { aspectRatio, width: '100%' }
        : { aspectRatio, height: '100%' };

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
          <EditableImage
            style={StyleSheet.absoluteFill}
            editionParameters={editionParameters}
            source={media}
          />
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

  return media.kind === 'image' ? (
    <EditableImageWithCropMode
      key={`${media.uri}-${aspectRatio}`}
      source={media}
      mediaSize={media}
      aspectRatio={aspectRatio}
      editionParameters={editionParameters}
      cropEditionMode={cropEditionMode}
      filters={mediaFilter ? [mediaFilter] : null}
      onCropDataChange={cropData =>
        onParameterValueChange('cropData', cropData)
      }
      style={{ flex: 1 }}
    />
  ) : (
    <EditableVideoWithCropMode
      mediaSize={media}
      key={`${media.uri}-${aspectRatio}`}
      aspectRatio={aspectRatio}
      uri={media.uri}
      editionParameters={editionParameters}
      cropEditionMode={cropEditionMode}
      filters={mediaFilter ? [mediaFilter] : null}
      {...timeRange}
      onCropDataChange={cropData =>
        onParameterValueChange('cropData', cropData)
      }
      style={{ flex: 1 }}
    />
  );
};

export default ImagePickerMediaRenderer;
