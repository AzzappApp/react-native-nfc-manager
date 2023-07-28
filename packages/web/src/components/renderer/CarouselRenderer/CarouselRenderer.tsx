import 'server-only';
import { getMediasByIds } from '@azzapp/data/domains';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { CAROUSEL_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from '../../CardModuleBackground';
import Carousel from './Carousel';
import type { ModuleRendererProps } from '../ModuleRenderer';

export type CarouselRendererProps = ModuleRendererProps &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

/**
 * Render a carousel module
 */
const CarouselRenderer = async ({
  module,
  style,
  ...props
}: CarouselRendererProps) => {
  const {
    images,
    squareRatio,
    borderSize,
    borderColor,
    borderRadius,
    marginVertical,
    marginHorizontal,
    imageHeight,
    gap,
    backgroundId,
    backgroundStyle,
  } = Object.assign({}, CAROUSEL_DEFAULT_VALUES, module.data);

  const height = imageHeight + marginVertical * 2;
  const medias = images
    ? convertToNonNullArray(await getMediasByIds(images))
    : [];

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
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
          borderColor={borderColor}
          borderRadius={borderRadius}
          borderSize={borderSize}
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
