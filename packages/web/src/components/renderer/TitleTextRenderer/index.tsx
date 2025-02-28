'use client';

import cn from 'classnames';
import { useMemo, useRef } from 'react';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getCarouselDefaultColors,
  type CardModuleTitleTextData,
} from '@azzapp/shared/cardModuleHelpers';
import { splitRichTextIntoColumns } from '@azzapp/shared/richText/stringUpdate';
import { fontsMap, webCardTextFontsMap } from '#helpers/fonts';
import { DEFAULT_MODULE_TEXT, DEFAULT_MODULE_TITLE } from '#helpers/modules';
import useContainerWidth from '#hooks/useContainerWidth';
import RichText from '#ui/RichText';
import styles from './index.css';
import type { ModuleRendererProps } from '../ModuleRenderer';
import type { CardModuleBase } from '@azzapp/data';
export type TitleTextRendererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleTitleTextData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

const TitleTextRenderer = ({
  cardStyle,
  colorPalette,
  coverBackgroundColor,
  module,
}: TitleTextRendererProps) => {
  const { text, title, cardModuleColor } = module.data;

  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);

  const { titleOnTop, nbColumn } = useMemo(() => {
    let titleOnTop = false;
    let nbColumn = 1;

    if (
      module.variant === 'left' ||
      module.variant === 'right' ||
      module.variant === 'center' ||
      module.variant === 'justified'
    ) {
      titleOnTop = true;
      nbColumn = 1;
    } else if (containerWidth < 600) {
      titleOnTop = true;
      nbColumn = 1;
    } else if (containerWidth < 900) {
      nbColumn = 2;
      titleOnTop = true;
      if (
        module.variant === 'column_2' ||
        module.variant === 'column_1' ||
        module.variant === 'column_2_justified' ||
        module.variant === 'column_1_justified'
      ) {
        nbColumn = 1;
        titleOnTop = false;
      }
    } else {
      titleOnTop = false;
      nbColumn = 2;
      if (
        module.variant === 'column_1' ||
        module.variant === 'column_1_justified'
      ) {
        nbColumn = 1;
        titleOnTop = false;
      } else if (
        module.variant === 'column_2' ||
        module.variant === 'column_2_justified'
      ) {
        nbColumn = 2;
        titleOnTop = false;
      } else if (
        module.variant === 'column_4' ||
        module.variant === 'column_4_justified'
      ) {
        nbColumn = 3;
      }
      if (
        module.variant === 'column_3' ||
        module.variant === 'column_4' ||
        module.variant === 'column_3_justified' ||
        module.variant === 'column_4_justified'
      ) {
        titleOnTop = true;
      }
    }

    return { titleOnTop, nbColumn };
  }, [containerWidth, module.variant]);

  const columns = splitRichTextIntoColumns(
    text ?? DEFAULT_MODULE_TEXT,
    nbColumn,
  );

  return (
    <div
      className={styles.container}
      style={{
        zIndex: 1,
        backgroundColor: swapColor(
          cardModuleColor?.background ??
            getCarouselDefaultColors(coverBackgroundColor)?.backgroundStyle
              ?.backgroundColor,
          colorPalette,
        ),
      }}
    >
      <div
        ref={containerRef}
        className={styles.section}
        style={{
          padding: Math.max(20, cardStyle?.gap ?? 0),
          gap: Math.max(20, cardStyle?.gap ?? 0),
          flexDirection: titleOnTop ? 'column' : 'row',
          alignItems: columns.length !== 1 ? 'center' : undefined,
        }}
      >
        {titleOnTop && (
          <h2
            className={cn(
              styles.title,
              fontsMap[cardStyle.titleFontFamily].className,
            )}
            style={{
              color: swapColor(cardModuleColor?.title, colorPalette),
              fontSize: cardStyle.titleFontSize,
              ...getTitleAlignmentStyle(module.variant),
            }}
          >
            {title ?? DEFAULT_MODULE_TITLE}
          </h2>
        )}

        <div
          className={styles.column}
          style={{
            gap: Math.max(20, cardStyle?.gap ?? 0),
          }}
        >
          {!titleOnTop && (
            <h2
              className={cn(
                styles.title,
                fontsMap[cardStyle.titleFontFamily].className,
              )}
              style={{
                color: swapColor(cardModuleColor?.title, colorPalette),
                fontSize: cardStyle.titleFontSize,
                ...getTitleAlignmentStyle(module.variant),
              }}
            >
              {title ?? DEFAULT_MODULE_TITLE}
            </h2>
          )}
          {columns.map((columnText, index) => (
            <p
              key={index}
              className={cn(
                styles.text,
                webCardTextFontsMap[cardStyle.fontFamily].className,
              )}
              style={{
                color: swapColor(cardModuleColor?.text, colorPalette),
                fontSize: cardStyle.fontSize,
                ...getTextAlignmentStyle(module.variant),
              }}
            >
              <RichText fontFamily={cardStyle.fontFamily} text={columnText} />
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TitleTextRenderer;

const getTitleAlignmentStyle = (variant: string | null) => {
  //specific case for title
  if (
    variant === 'justified' ||
    variant === 'column_1_justified' ||
    variant === 'column_2_justified' ||
    variant === 'column_3_justified' ||
    variant === 'column_4_justified'
  ) {
    return { textAlign: 'left' as const };
  }
  return getTextAlignmentStyle(variant);
};

const getTextAlignmentStyle = (variant: string | null) => {
  switch (variant) {
    case 'left':
      return { textAlign: 'left' as const };
    case 'right':
      return { textAlign: 'right' as const };
    case 'center':
      return { textAlign: 'center' as const };
    case 'justified':
    case 'column_1_justified':
    case 'column_2_justified':
    case 'column_3_justified':
    case 'column_4_justified':
      return { textAlign: 'justify' as const };
    default:
      return { textAlign: 'left' as const };
  }
};
