import LineDividerRenderer from '#components/cardModules/LineDividerRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { LineDividerRendererProps } from '#components/cardModules/LineDividerRenderer';

type LineDividerPreviewProps = Pick<
  LineDividerRendererProps,
  'animatedData' | 'cardStyle' | 'colorPalette' | 'data' | 'style'
> & {
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
  colorPalette,
  cardStyle,
  onPreviewPress,
  animatedData,
  ...props
}: LineDividerPreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <LineDividerRenderer
        colorPalette={colorPalette}
        cardStyle={cardStyle}
        data={data}
        animatedData={animatedData!}
      />
    </EditorScaledPreview>
  );
};

export default LineDividerPreview;
