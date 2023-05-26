import { StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import { CarouselRendererRaw } from '#components/CarouselRenderer';
import type { CarouselRawData } from '#components/CarouselRenderer';
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

const styles = StyleSheet.create({
  module: {
    shadowColor: colors.black,
    shadowOpacity: 0.42,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 17,
    width: '100%',
  },
});
