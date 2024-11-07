import cn from 'classnames';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
  getModuleDataValues,
  getPhotoWithTextAndTitleDefaultValues,
} from '@azzapp/shared/cardModuleHelpers';
import { fontsMap } from '#helpers/fonts';
import CloudinaryImage from '#ui/CloudinaryImage';
import CardModuleBackground from '../../CardModuleBackground';
import styles from './PhotoWithTextAndTitleRenderer.css';
import type { ModuleRendererProps } from '../ModuleRenderer';
import type { CardModulePhotoWithTextAndTitle } from '@azzapp/data';
import type { CSSProperties } from 'react';

export type PhotoWithTextAndTitleRendererProps =
  ModuleRendererProps<CardModulePhotoWithTextAndTitle> &
    Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

/**
 * Render a PhotoWithTextAndTitle module
 */
const PhotoWithTextAndTitleRenderer = ({
  module,
  colorPalette,
  cardStyle,
  coverBackgroundColor,
  ...props
}: PhotoWithTextAndTitleRendererProps) => {
  const {
    image,
    contentFontFamily,
    contentFontColor,
    contentTextAlign,
    contentFontSize,
    contentVerticalSpacing,
    content,
    titleFontFamily,
    titleFontColor,
    titleTextAlign,
    titleFontSize,
    titleVerticalSpacing,
    title,
    imageMargin,
    verticalArrangement,
    horizontalArrangement,
    gap,
    borderRadius,
    marginHorizontal,
    marginVertical,
    aspectRatio,
    backgroundId,
    backgroundStyle,
  } = getModuleDataValues({
    data: module.data,
    cardStyle,
    styleValuesMap: PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
    defaultValues: getPhotoWithTextAndTitleDefaultValues(coverBackgroundColor),
  });

  const classnames = cn(styles.wrapper, {
    [styles.wrapperArrangmentTop]: verticalArrangement === 'top',
    [styles.wrapperArrangmentBottom]: verticalArrangement !== 'top',
    [styles.wrapperArrangmentLeft]: horizontalArrangement === 'left',
    [styles.wrapperArrangmentRight]: horizontalArrangement !== 'left',
  });

  const isImageFull = imageMargin === 'width_full';

  return (
    <CardModuleBackground
      {...props}
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
      colorPalette={colorPalette}
      containerStyle={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
      }}
    >
      <div
        style={
          {
            display: 'flex',
            rowGap: gap,
            columnGap: gap,
            paddingLeft: imageMargin === 'width_full' ? 0 : marginHorizontal,
            paddingRight: imageMargin === 'width_full' ? 0 : marginHorizontal,
            paddingTop: isImageFull ? 0 : marginVertical,
            paddingBottom: isImageFull ? 0 : marginVertical,
            justifyContent: 'center',
            width: isImageFull ? '100%' : 800,
          } as CSSProperties
        }
        className={classnames}
      >
        {image && (
          <div className={styles.sectionImage}>
            <div
              style={{
                position: 'relative',
                maxWidth: isImageFull ? '100%' : `calc(400px - ${gap / 2}px)`,
                width: '100%',
              }}
              className={styles.sectionImageInner}
            >
              <CloudinaryImage
                mediaId={image}
                fill
                sizes="100vw"
                alt="TODO"
                style={{
                  objectFit: 'cover',
                  aspectRatio: `${aspectRatio}`,
                  borderRadius,
                }}
                className={styles.image}
                format="auto"
                quality="auto:best"
              />
            </div>
          </div>
        )}
        <div className={styles.sectionText}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              paddingLeft: imageMargin === 'width_full' ? marginHorizontal : 0,
              paddingRight: imageMargin === 'width_full' ? marginHorizontal : 0,
              maxWidth: `calc(400px - ${gap / 2}px)`,
              width: '100%',
            }}
            className={styles.text}
          >
            {title && (
              <h2
                style={{
                  textAlign: titleTextAlign,
                  fontSize: titleFontSize,
                  color: swapColor(titleFontColor, colorPalette),
                  lineHeight:
                    titleFontSize && titleVerticalSpacing
                      ? `${titleFontSize * 1.2 + titleVerticalSpacing}px`
                      : undefined,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
                className={fontsMap[titleFontFamily].className}
              >
                {title}
              </h2>
            )}
            {content && (
              <div
                style={{
                  textAlign: contentTextAlign,
                  fontSize: contentFontSize,
                  marginTop: 7,
                  color: swapColor(contentFontColor, colorPalette),
                  lineHeight:
                    contentFontSize && contentVerticalSpacing
                      ? `${contentFontSize * 1.2 + contentVerticalSpacing}px`
                      : undefined,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
                className={fontsMap[contentFontFamily].className}
              >
                {content}
              </div>
            )}
          </div>
        </div>
      </div>
    </CardModuleBackground>
  );
};

export default PhotoWithTextAndTitleRenderer;
