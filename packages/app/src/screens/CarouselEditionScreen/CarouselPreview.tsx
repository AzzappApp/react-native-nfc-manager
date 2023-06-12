import { View } from 'react-native';
import { colors, shadow } from '#theme';
import { CarouselRendererRaw } from '#components/cardModules/CarouselRenderer';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { CarouselRawData } from '#components/cardModules/CarouselRenderer';
import type { ViewProps } from 'react-native';

type CarouselPreviewProps = ViewProps & {
  /**
   * the data of the module to preview.
   */
  data: CarouselRawData;
  /**
   * height of the preview
   */
  height: number;
};

/**
 * Preview of the carousel module.
 */
const CarouselPreview = ({ data, height, ...props }: CarouselPreviewProps) => {
  const { imageHeight, marginVertical, borderSize } = data;
  const moduleHeight = imageHeight + marginVertical * 2 + borderSize * 2;
  const scale = Math.min(height / moduleHeight, 1);

  const styles = useStyleSheet(styleSheet);
  return (
    <View {...props}>
      <View
        style={{
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
        }}
      >
        <CarouselRendererRaw data={data} style={styles.module} />
      </View>
    </View>
  );
};

export default CarouselPreview;

const styleSheet = createStyleSheet(apperance => ({
  module: [{ width: '100%' }, shadow(apperance)],
}));
