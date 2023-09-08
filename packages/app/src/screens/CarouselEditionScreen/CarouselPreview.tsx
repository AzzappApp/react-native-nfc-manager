import { View } from 'react-native';
import { colors, shadow } from '#theme';
import CarouselRenderer from '#components/cardModules/CarouselRenderer';
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
  const { imageHeight, marginVertical, borderWidth } = data;
  const moduleHeight =
    (imageHeight ?? 200) + (marginVertical ?? 20) * 2 + (borderWidth ?? 0) * 2;
  const scale = Math.min(height / moduleHeight, 1);

  const styles = useStyleSheet(styleSheet);
  return (
    <View {...props}>
      <View
        style={[
          {
            position: 'absolute',
            backgroundColor: colors.white,
            minHeight: height,
            top: scale === 1 ? 0 : (height - moduleHeight) / 2,
            left: `${(100 - 100 / scale) / 2}%`,
            width: `${100 / scale}%`,
            transform: [{ scale }],
            overflow: 'visible',
            alignItems: 'center',
            justifyContent: 'center',
          },
          styles.container,
        ]}
      >
        <CarouselRenderer
          data={data}
          colorPalette={colorPalette}
          cardStyle={cardStyle}
          style={styles.module}
        />
      </View>
    </View>
  );
};

export default CarouselPreview;

const styleSheet = createStyleSheet(apperance => ({
  module: [{ width: '100%' }, shadow(apperance)],
  container: shadow(apperance),
}));
