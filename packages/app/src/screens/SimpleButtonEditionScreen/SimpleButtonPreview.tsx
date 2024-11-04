import { useIntl } from 'react-intl';
import {
  SimpleButtonRenderer,
  type SimpleButtonRendererProps,
} from '#components/cardModules/SimpleButtonRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';

type SimpleButtonPreviewProps = Pick<
  SimpleButtonRendererProps,
  'animatedData' | 'cardStyle' | 'colorPalette' | 'data' | 'style'
> & {
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;
};

/**
 * Preview of the SimpleButton module.
 */
const SimpleButtonPreview = ({
  data,
  animatedData,
  colorPalette,
  cardStyle,
  onPreviewPress,
  ...props
}: SimpleButtonPreviewProps) => {
  const intl = useIntl();
  const moduleData = {
    ...data,
    buttonLabel:
      data.buttonLabel ||
      intl.formatMessage({
        defaultMessage: 'Button Label',
        description: 'Placeholder for button that has no label yet',
      }),
  };

  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <SimpleButtonRenderer
        cardStyle={cardStyle}
        colorPalette={colorPalette}
        data={moduleData}
        animatedData={animatedData!}
        disabled
      />
    </EditorScaledPreview>
  );
};

export default SimpleButtonPreview;
