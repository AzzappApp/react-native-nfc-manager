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
    onParameterValueChange,
  } = useImagePickerState();

  if (!media) {
    return null;
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
