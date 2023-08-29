import { assignInlineVars } from '@vanilla-extract/dynamic';
import cn from 'classnames';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
  PHOTO_WITH_TEXT_AND_TITLE_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import { fontsMap } from '#helpers/fonts';
import CloudinaryImage from '#ui/CloudinaryImage';
import CardModuleBackground from '../../CardModuleBackground';
import styles, { wrapperMarginTop } from './PhotoWithTextAndTitleRenderer.css';
import type { ModuleRendererProps } from '../ModuleRenderer';
import type { CardModulePhotoWithTextAndTitle } from '@azzapp/data/domains';
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
    defaultValues: PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES,
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
      backgroundId={backgroundId}
      backgroundStyle={backgroundStyle}
      colorPalette={colorPalette}
      {...props}
    >
      <div
        style={
          {
            display: 'flex',
            rowGap: gap,
            columnGap: gap,
            paddingLeft: imageMargin === 'width_full' ? 0 : marginHorizontal,
            paddingRight: imageMargin === 'width_full' ? 0 : marginHorizontal,
            justifyContent: 'center',
            ...assignInlineVars({ [wrapperMarginTop]: `${marginVertical}px` }),
          } as CSSProperties
        }
        className={classnames}
      >
        {image && (
          <div className={styles.sectionImage}>
            <div
              style={{
                position: 'relative',
                aspectRatio: `${aspectRatio}`,
                maxWidth: isImageFull ? '100%' : `calc(400px - ${gap / 2}px)`,
                width: '100%',
                marginTop: isImageFull ? 0 : marginVertical,
                marginBottom: isImageFull ? 0 : marginVertical,
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
          </div>
        )}
        <div className={styles.sectionText}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              paddingLeft: marginHorizontal,
              paddingRight: marginHorizontal,
              maxWidth: `calc(400px - ${gap / 2}px)`,
              marginTop: marginVertical,
              marginBottom: marginVertical,
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
                  whiteSpace: 'pre-line',
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
