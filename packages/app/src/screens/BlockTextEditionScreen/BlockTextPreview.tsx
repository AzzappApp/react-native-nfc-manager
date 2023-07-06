import { BlockTextRendererRaw } from '#components/cardModules/BlockTextRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { BlockTextRawData } from '#components/cardModules/BlockTextRenderer';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type BlockTextPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: BlockTextRawData;
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;
};

/**
 * Preview of the BlockText module.
 */
const BlockTextPreview = ({
  data,
  onPreviewPress,
  ...props
}: BlockTextPreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <BlockTextRendererRaw data={data} />
    </EditorScaledPreview>
  );
};

export default BlockTextPreview;
