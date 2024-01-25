import { shadow } from '#theme';
import CarouselRenderer from '#components/cardModules/CarouselRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { CarouselRendererData } from '#components/cardModules/CarouselRenderer';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ViewProps } from 'react-native';

type CarouselPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: CarouselRendererData;
  /**
   * height of the preview
   */
  height: number;
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the color palette
   */
  cardStyle: CardStyle | null | undefined;
};

/**
 * Preview of the carousel module.
 */
const CarouselPreview = ({
  data,
  colorPalette,
  cardStyle,
  height,
  ...props
}: CarouselPreviewProps) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <EditorScaledPreview {...props}>
      <CarouselRenderer
        data={data}
        colorPalette={colorPalette}
        cardStyle={cardStyle}
        style={styles.module}
      />
    </EditorScaledPreview>
  );
};

export default CarouselPreview;

const styleSheet = createStyleSheet(apperance => ({
  module: [{ width: '100%' }],
  container: shadow(apperance),
}));
