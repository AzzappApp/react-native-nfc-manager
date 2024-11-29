import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  HORIZONTAL_PHOTO_DEFAULT_VALUES,
  HORIZONTAL_PHOTO_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import CardModuleBackground from '../CardModuleBackground';
import type { ModuleRendererProps } from './ModuleRenderer';
import type { CardModuleHorizontalPhoto } from '@azzapp/data';

export type HorizontalPhotoRendererProps =
  ModuleRendererProps<CardModuleHorizontalPhoto> &
    Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

/**
 * Render a HorizontalPhoto module
 */
const HorizontalPhotoRenderer = async ({
  module,
  colorPalette,
  cardStyle,
  style,
  coverBackgroundColor,
  ...props
}: HorizontalPhotoRendererProps) => {
  const {
    borderWidth,
    borderRadius,
    borderColor,
    marginHorizontal,
    marginVertical,
    imageHeight,
    backgroundId,
    backgroundStyle,
    image,
  } = getModuleDataValues({
    data: module.data,
    cardStyle,
    styleValuesMap: HORIZONTAL_PHOTO_STYLE_VALUES,
    defaultValues: HORIZONTAL_PHOTO_DEFAULT_VALUES,
  });

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
      colorPalette={colorPalette}
      style={style}
      containerStyle={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: marginHorizontal ? 800 : '100%',
          width: '100%',
          paddingLeft: marginHorizontal,
          paddingRight: marginHorizontal,
          paddingTop: marginVertical,
          paddingBottom: marginVertical,
        }}
      >
        <div
          style={{
            ...style,
            height: imageHeight,
            borderWidth,
            borderRadius,
            borderStyle: 'solid',
            borderColor: swapColor(borderColor, colorPalette) ?? '#FFF',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {image && (
            <CloudinaryImage
              mediaId={image}
              fill
              sizes="100vw"
              alt="TODO"
              style={{
                objectFit: 'cover',
              }}
              format="auto"
              quality="auto:best"
            />
          )}
        </div>
      </div>
    </CardModuleBackground>
  );
};

export default HorizontalPhotoRenderer;
