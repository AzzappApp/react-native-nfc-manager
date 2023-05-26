import EditorScaledPreview from '#components/EditorScaledPreview';
import { SimpleTextRendererRaw } from '#components/SimpleTextRenderer';
import type { SimpleTextRawData } from '#components/SimpleTextRenderer';
import type { ViewProps } from 'react-native';

type SimpleTextPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: SimpleTextRawData;
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress: () => void;
};

/**
 * Preview of the simple text module.
 */
const SimpleTextPreview = ({
  data,
  onPreviewPress,
  ...props
}: SimpleTextPreviewProps) => {
  return (
    <EditorScaledPreview
      onPreviewPress={onPreviewPress}
      moduleContainerStyle={!data.text && { height: '50%' }}
      {...props}
    >
      <SimpleTextRendererRaw data={data} />
    </EditorScaledPreview>
  );
};

export default SimpleTextPreview;
