import BlockTextRenderer from '#components/cardModules/BlockTextRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { BlockTextRendererProps } from '#components/cardModules/BlockTextRenderer';

type BlockTextPreviewProps = Pick<
  BlockTextRendererProps,
  'animatedData' | 'cardStyle' | 'colorPalette' | 'data' | 'style'
> & {
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
  colorPalette,
  cardStyle,
  onPreviewPress,
  animatedData,
  ...props
}: BlockTextPreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <BlockTextRenderer
        data={data}
        animatedData={animatedData!}
        cardStyle={cardStyle}
        colorPalette={colorPalette}
      />
    </EditorScaledPreview>
  );
};

export default BlockTextPreview;
