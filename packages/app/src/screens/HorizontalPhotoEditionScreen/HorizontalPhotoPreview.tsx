import { HorizontalPhotoRendererRaw } from '#components/cardModules/HorizontalPhotoRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import type { HorizontalPhotoRawData } from '#components/cardModules/HorizontalPhotoRenderer';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type HorizontalPhotoPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: HorizontalPhotoRawData;
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
 * Preview of the HorizontalPhoto module.
 */
const HorizontalPhotoPreview = ({
  data,
  colorPalette,
  cardStyle,
  onPreviewPress,
  ...props
}: HorizontalPhotoPreviewProps) => {
  return (
    <EditorScaledPreview onPreviewPress={onPreviewPress} {...props}>
      <HorizontalPhotoRendererRaw
        data={data}
        colorPalette={colorPalette}
        cardStyle={cardStyle}
      />
    </EditorScaledPreview>
  );
};

export default HorizontalPhotoPreview;
