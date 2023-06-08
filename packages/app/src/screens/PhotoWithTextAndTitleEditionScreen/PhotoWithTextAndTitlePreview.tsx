import EditorScaledPreview from '#components/EditorScaledPreview';
import { PhotoWithTextAndTitleRendererRaw } from '#components/PhotoWithTextAndTitleRenderer';
import type { PhotoWithTextAndTitleRawData } from '#components/PhotoWithTextAndTitleRenderer';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type PhotoWithTextAndTitlePreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: PhotoWithTextAndTitleRawData;
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;
};

/**
 * Preview of the PhotoWithTextAndTitle module.
 */
const PhotoWithTextAndTitlePreview = ({
  data,
  onPreviewPress,
  ...props
}: PhotoWithTextAndTitlePreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <PhotoWithTextAndTitleRendererRaw data={data} />
    </EditorScaledPreview>
  );
};

export default PhotoWithTextAndTitlePreview;
