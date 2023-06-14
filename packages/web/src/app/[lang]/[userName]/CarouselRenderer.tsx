import { getMediasByIds, type CardModule } from '@azzapp/data/domains';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { CAROUSEL_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import CardModuleBackground from './CardModuleBackground';

export type CarouselRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children'
> & {
  module: CardModule;
};

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

  const height = imageHeight + marginVertical * 2 + borderSize * 2;
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
          overflowX: 'auto',
          paddingTop: marginVertical,
          paddingBottom: marginVertical,
          paddingLeft: marginHorizontal,
          paddingRight: marginHorizontal,
          columnGap: gap,
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {medias.map(media => {
          const aspectRatio = media.width / media.height;
          const width = imageHeight * (squareRatio ? 1 : aspectRatio);
          return (
            <CloudinaryImage
              key={media.id}
              mediaId={media.id}
              width={width}
              height={imageHeight}
              alt="todo"
              style={{
                borderRadius,
                borderColor,
                borderWidth: borderSize,
                borderStyle: 'solid',
                objectFit: 'cover',
              }}
            />
          );
        })}
      </div>
    </CardModuleBackground>
  );
};

export default CarouselRenderer;
