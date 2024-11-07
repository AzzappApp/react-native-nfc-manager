import 'server-only';
import { getMediasByIds } from '@azzapp/data';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  CAROUSEL_STYLE_VALUES,
  getCarouselDefaultValues,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from '../../CardModuleBackground';
import Carousel from './Carousel';
import type { ModuleRendererProps } from '../ModuleRenderer';
import type { CardModuleCarousel } from '@azzapp/data';

export type CarouselRendererProps = ModuleRendererProps<CardModuleCarousel> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

/**
 * Render a carousel module
 */
const CarouselRenderer = async ({
  module,
  style,
  cardStyle,
  colorPalette,
  coverBackgroundColor,
  ...props
}: CarouselRendererProps) => {
  const {
    images,
    squareRatio,
    borderWidth,
    borderColor,
    borderRadius,
    marginVertical,
    marginHorizontal,
    imageHeight,
    gap,
    backgroundId,
    backgroundStyle,
  } = getModuleDataValues({
    data: module.data,
    cardStyle,
    styleValuesMap: CAROUSEL_STYLE_VALUES,
    defaultValues: getCarouselDefaultValues(coverBackgroundColor),
  });

  const height = imageHeight + marginVertical * 2;
  const medias = images
    ? convertToNonNullArray(await getMediasByIds(images))
    : [];

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
      colorPalette={colorPalette}
      style={{ ...style, height }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        <Carousel
          borderColor={swapColor(borderColor, colorPalette)}
          borderRadius={borderRadius}
          borderWidth={borderWidth}
          gap={gap}
          imageHeight={imageHeight}
          marginHorizontal={marginHorizontal}
          marginVertical={marginVertical}
          medias={medias}
          squareRatio={squareRatio}
        />
      </div>
    </CardModuleBackground>
  );
};

export default CarouselRenderer;
