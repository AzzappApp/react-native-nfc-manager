import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import EditableImage from './EditableImage';
import ImageEditor from './ImageEditor';
import { useImagePickerState } from './ImagePickerContext';

const WizardImageEditor = ({
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

  return (
    <ImageEditor
      // TODO only way to make reanimated styles reset ...
      key={`${media.path}-${aspectRatio}`}
      style={{ width: '100%', height: '100%' }}
      aspectRatio={aspectRatio}
      media={media}
      editionParameters={editionParameters}
      cropEditionMode={cropEditionMode}
      filters={mediaFilter ? [mediaFilter] : null}
      {...timeRange}
      onCropDataChange={cropData =>
        onParameterValueChange('cropData', cropData)
      }
    />
  );
};

export default WizardImageEditor;
