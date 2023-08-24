import LineDividerRenderer from '#components/cardModules/LineDividerRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { LineDividerRendererData } from '#components/cardModules/LineDividerRenderer';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type LineDividerPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: LineDividerRendererData;
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
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
  ...props
}: LineDividerPreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <LineDividerRenderer
        colorPalette={colorPalette}
        cardStyle={cardStyle}
        data={data}
      />
    </EditorScaledPreview>
  );
};

export default LineDividerPreview;
