import { useIntl } from 'react-intl';
import SimpleTextRenderer from '#components/cardModules/SimpleTextRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { SimpleTextRendererData } from '#components/cardModules/SimpleTextRenderer';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ViewProps } from 'react-native';

type SimpleTextPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: SimpleTextRendererData;
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
  onPreviewPress: () => void;
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
  const intl = useIntl();
  const moduleData = {
    ...data,
    text:
      data.text ||
      (data.kind === 'simpleTitle'
        ? intl.formatMessage({
            defaultMessage:
              "Add section Title here. To edit this section, simply click on the text and start typing. You can change the font style, size, color, and alignment using the editing tools provided. Adjust the margins and the background for this section to match your webcard's design and branding.",
            description: 'Default text for the simple title module',
          })
        : intl.formatMessage({
            defaultMessage:
              "Add your Text here. To edit this section, simply click on the text and start typing. You can change the font style, size, color, and alignment using the editing tools provided. Adjust the margins and the background for this section to match your webcard's design and branding.",
            description: 'Default text for the simple text module',
          })),
  };

  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <SimpleTextRenderer
        data={moduleData}
        colorPalette={colorPalette}
        cardStyle={cardStyle}
      />
    </EditorScaledPreview>
  );
};

export default SimpleTextPreview;
