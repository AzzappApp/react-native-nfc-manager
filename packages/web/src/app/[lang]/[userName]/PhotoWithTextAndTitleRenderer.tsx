import { PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import CloudinaryImage from '#ui/CloudinaryImage';
import CardModuleBackground from './CardModuleBackground';
import type { CardModule } from '@azzapp/data/domains';

export type PhotoWithTextAndTitleRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children'
> & {
  module: CardModule;
};

/**
 * Render a PhotoWithTextAndTitle module
 */
const PhotoWithTextAndTitleRenderer = ({
  module,
  ...props
}: PhotoWithTextAndTitleRendererProps) => {
  const {
    image,
    fontFamily,
    fontColor,
    textAlign,
    text,
    title,
    imageMargin,
    verticalArrangement,
    // TODO handle horizontalArrangement
    // horizontalArrangement,
    gap,
    fontSize,
    textSize,
    borderRadius,
    marginHorizontal,
    marginVertical,
    verticalSpacing,
    aspectRatio,
    backgroundId,
    backgroundStyle,
  } = Object.assign({}, PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES, module.data);

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
    >
      <div
        style={{
          marginTop: marginVertical,
          marginBottom: marginVertical,
          display: 'flex',
          flexDirection:
            verticalArrangement === 'top' ? 'column-reverse' : 'column-reverse',
          rowGap: gap,
          columnGap: gap,
        }}
      >
        {image && (
          <div
            style={{
              position: 'relative',
              marginLeft: imageMargin === 'width_full' ? 0 : marginHorizontal,
              marginRight: imageMargin === 'width_full' ? 0 : marginHorizontal,
              aspectRatio: `${aspectRatio}`,
            }}
          >
            <CloudinaryImage
              mediaId={image}
              fill
              alt="TODO"
              style={Object.assign({
                objectFit: 'cover',
                aspectRatio: `${aspectRatio}`,
                borderRadius,
              })}
            />
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: marginHorizontal,
            marginRight: marginHorizontal,
          }}
        >
          <h2
            style={{
              textAlign,
              fontSize,
              fontFamily,
              color: fontColor,
            }}
          >
            {title}
          </h2>

          <div
            style={{
              textAlign,
              fontSize: textSize,
              fontFamily,
              marginTop: 7,
              color: fontColor,
              lineHeight:
                fontSize && verticalSpacing
                  ? `${fontSize * 1.2 + verticalSpacing}px`
                  : undefined,
              whiteSpace: 'pre-wrap',
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </CardModuleBackground>
  );
};

export default PhotoWithTextAndTitleRenderer;
