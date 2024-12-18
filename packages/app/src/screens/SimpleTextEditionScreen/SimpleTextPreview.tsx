import SimpleTextRenderer from '#components/cardModules/SimpleTextRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { SimpleTextRendererProps } from '#components/cardModules/SimpleTextRenderer';

type SimpleTextPreviewProps = Pick<
  SimpleTextRendererProps,
  'cardStyle' | 'colorPalette' | 'data' | 'style'
> & {
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;
};

/**
 * Preview of the simple text module.
 */
const SimpleTextPreview = ({
  data,
  colorPalette,
  cardStyle,
  onPreviewPress,
  ...props
}: SimpleTextPreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <SimpleTextRenderer
        data={data}
        colorPalette={colorPalette}
        cardStyle={cardStyle}
      />
    </EditorScaledPreview>
  );
};

export default SimpleTextPreview;
