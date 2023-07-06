import { HorizontalPhotoRendererRaw } from '#components/cardModules/HorizontalPhotoRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { HorizontalPhotoRawData } from '#components/cardModules/HorizontalPhotoRenderer';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type HorizontalPhotoPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: HorizontalPhotoRawData;
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;
};

/**
 * Preview of the HorizontalPhoto module.
 */
const HorizontalPhotoPreview = ({
  data,
  onPreviewPress,
  ...props
}: HorizontalPhotoPreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <HorizontalPhotoRendererRaw data={data} />
    </EditorScaledPreview>
  );
};

export default HorizontalPhotoPreview;
