import EditorScaledPreview from '#components/EditorScaledPreview';
import { SimpleTextRendererRaw } from '#components/SimpleTextRenderer';
import type { SimpleTextRenderer_module$data } from '@azzapp/relay/artifacts/SimpleTextRenderer_module.graphql';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type SimpleTextPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: SimpleTextRenderer_module$data;
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
