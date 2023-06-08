import EditorScaledPreview from '#components/EditorScaledPreview';
import { LineDividerRendererRaw } from '#components/LineDividerRenderer';
import type { LineDividerRawData } from '#components/LineDividerRenderer';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type LineDividerPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: LineDividerRawData;
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;
};

/**
 * Preview of the Line Divider module.
 */
const LineDividerPreview = ({
  data,
  onPreviewPress,
  ...props
}: LineDividerPreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <LineDividerRendererRaw data={data} />
    </EditorScaledPreview>
  );
};

export default LineDividerPreview;
