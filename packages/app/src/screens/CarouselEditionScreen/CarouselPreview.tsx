import { shadow } from '#theme';
import CarouselRenderer from '#components/cardModules/CarouselRenderer';
import EditorScaledPreview from '#components/EditorScaledPreview';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { CarouselRendererProps } from '#components/cardModules/CarouselRenderer/CarouselRenderer';

type CarouselPreviewProps = Pick<
  CarouselRendererProps,
  'animatedData' | 'cardStyle' | 'colorPalette' | 'data' | 'style'
> & {
  /**
   * A callback that is called when the module preview is pressed.
   */
  onPreviewPress?: () => void;
};

/**
 * Preview of the carousel module.
 */
const CarouselPreview = ({
  data,
  colorPalette,
  cardStyle,
  animatedData,
  ...props
}: CarouselPreviewProps) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <EditorScaledPreview {...props}>
      <CarouselRenderer
        data={data}
        animatedData={animatedData}
        colorPalette={colorPalette}
        cardStyle={cardStyle}
        style={styles.module}
      />
    </EditorScaledPreview>
  );
};

export default CarouselPreview;

const styleSheet = createStyleSheet(appearance => ({
  module: [{ width: '100%' }],
  container: shadow(appearance),
}));
