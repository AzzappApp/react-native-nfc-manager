import { HORIZONTAL_PHOTO_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import CardModuleBackground from '../CardModuleBackground';
import type { CardModule } from '@azzapp/data/domains';

export type HorizontalPhotoRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children'
> & {
  module: CardModule;
};

/**
 * Render a HorizontalPhoto module
 */
const HorizontalPhotoRenderer = async ({
  module,
  style,
  ...props
}: HorizontalPhotoRendererProps) => {
  const {
    borderWidth,
    borderRadius,
    borderColor,
    marginHorizontal,
    marginVertical,
    height,
    backgroundId,
    backgroundStyle,
    image,
  } = Object.assign({}, HORIZONTAL_PHOTO_DEFAULT_VALUES, module.data);

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
      style={style}
    >
      <div
        style={{
          ...style,
          height,
          borderWidth,
          borderRadius,
          borderStyle: 'solid',
          marginRight: marginHorizontal,
          marginLeft: marginHorizontal,
          marginTop: marginVertical,
          marginBottom: marginVertical,
          borderColor,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {image && (
          <CloudinaryImage
            mediaId={image}
            fill
            alt="TODO"
            style={{
              objectFit: 'cover',
            }}
          />
        )}
      </div>
    </CardModuleBackground>
  );
};

export default HorizontalPhotoRenderer;
