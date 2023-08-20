import { useIntl } from 'react-intl';
import { SimpleButtonRendererRaw } from '#components/cardModules/SimpleButtonRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { SimpleButtonRawData } from '#components/cardModules/SimpleButtonRenderer';
import type { ColorPalette } from '#components/CoverEditor/coverEditorTypes';
import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type SimpleButtonPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: SimpleButtonRawData;
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
 * Preview of the SimpleButton module.
 */
const SimpleButtonPreview = ({
  data,
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
      <SimpleButtonRendererRaw
        cardStyle={cardStyle}
        colorPalette={colorPalette}
        data={moduleData}
      />
    </EditorScaledPreview>
  );
};

export default SimpleButtonPreview;
