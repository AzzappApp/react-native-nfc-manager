import { useIntl } from 'react-intl';
import BlockTextRenderer from '#components/cardModules/BlockTextRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { BlockTextRendererData } from '#components/cardModules/BlockTextRenderer';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type BlockTextPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: BlockTextRendererData;
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
 * Preview of the BlockText module.
 */
const BlockTextPreview = ({
  data,
  colorPalette,
  cardStyle,
  onPreviewPress,
  ...props
}: BlockTextPreviewProps) => {
  const intl = useIntl();
  const moduleData = {
    ...data,
    text:
      data?.text ||
      intl.formatMessage({
        defaultMessage:
          "Add section Text here. To edit this section, simply click on the text and start typing. You can change the font style, size, color, and alignment using the editing tools provided. Adjust the margins, the spacing, the text background, and the section background for this section to match your webcard's design and branding.",
        description: 'Default text for the BlockText module',
      }),
  };
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <BlockTextRenderer
        data={moduleData}
        cardStyle={cardStyle}
        colorPalette={colorPalette}
      />
    </EditorScaledPreview>
  );
};

export default BlockTextPreview;
