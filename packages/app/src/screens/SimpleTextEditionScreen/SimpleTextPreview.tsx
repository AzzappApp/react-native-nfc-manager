import { useIntl } from 'react-intl';
import SimpleTextRenderer from '#components/cardModules/SimpleTextRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import Text from '#ui/Text';
import type { SimpleTextRendererProps } from '#components/cardModules/SimpleTextRenderer';

type SimpleTextPreviewProps = Pick<
  SimpleTextRendererProps,
  'animatedData' | 'cardStyle' | 'colorPalette' | 'data' | 'style'
> & {
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;

  animatedData: object;
};

/**
 * Preview of the simple text module.
 */
const SimpleTextPreview = ({
  data,
  colorPalette,
  cardStyle,
  onPreviewPress,
  animatedData,
  ...props
}: SimpleTextPreviewProps) => {
  const intl = useIntl();
  const moduleData = {
    ...data,
    text:
      data.text ||
      (data.kind === 'simpleTitle'
        ? (intl.formatMessage(
            {
              defaultMessage:
                'Add section contents here. To edit the text, simply open the editor and start typing. You can also change the font style, size, color, and alignment using the editing tools provided. Adjust the margins and the background for this section to match the design and branding of your WebCard{azzappA}.',
              description: 'Default text for the simple title module',
            },
            {
              azzappA: <Text variant="azzapp">a</Text>,
            },
          ) as string)
        : (intl.formatMessage(
            {
              defaultMessage:
                'Add section contents here. To edit the text, simply open the editor and start typing. You can also change the font style, size, color, and alignment using the editing tools provided. Adjust the margins and the background for this section to match the design and branding of your WebCard{azzappA}.',
              description: 'Default text for the simple text module',
            },
            {
              azzappA: <Text variant="azzapp">a</Text>,
            },
          ) as string)),
  };

  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <SimpleTextRenderer
        data={moduleData}
        animatedData={animatedData}
        colorPalette={colorPalette}
        cardStyle={cardStyle}
      />
    </EditorScaledPreview>
  );
};

export default SimpleTextPreview;
