import EditorScaledPreview from '#components/EditorScaledPreview';
import { SimpleButtonRendererRaw } from '#components/SimpleButtonRenderer';
import type { SimpleButtonRawData } from '#components/SimpleButtonRenderer';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type SimpleButtonPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: SimpleButtonRawData;
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;
};

/**
 * Preview of the SimpleButton module.
 */
const SimpleButtonPreview = ({
  data,
  onPreviewPress,
  ...props
}: SimpleButtonPreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <SimpleButtonRendererRaw data={data} />
    </EditorScaledPreview>
  );
};

export default SimpleButtonPreview;
