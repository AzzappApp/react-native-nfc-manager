import cn from 'classnames';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  getCarouselDefaultColors,
  type CardModuleTitleTextData,
} from '@azzapp/shared/cardModuleHelpers';
import { fontsMap } from '#helpers/fonts';
import { DEFAULT_MODULE_TEXT, DEFAULT_MODULE_TITLE } from '#helpers/modules';
import styles from './index.css';
import type { ModuleRendererProps } from '../ModuleRenderer';
import type { CardModuleBase } from '@azzapp/data';

export type TitleTextRendererProps = ModuleRendererProps<
  CardModuleBase & {
    data: CardModuleTitleTextData;
  }
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'children'>;

const TitleTextRenderer = async ({
  cardStyle,
  colorPalette,
  coverBackgroundColor,
  module,
}: TitleTextRendererProps) => {
  const { text, title, cardModuleColor } = module.data;

  return (
    <div
      className={styles.container}
      style={{
        zIndex: 1,
        padding: Math.max(20, cardStyle?.gap ?? 0),
        gap: Math.max(20, cardStyle?.gap ?? 0),
        backgroundColor: swapColor(
          cardModuleColor?.background ??
            getCarouselDefaultColors(coverBackgroundColor)?.backgroundStyle
              ?.backgroundColor,
          colorPalette,
        ),
      }}
    >
      <div
        className={styles.section}
        style={{
          padding: Math.max(20, cardStyle?.gap ?? 0),
          gap: Math.max(20, cardStyle?.gap ?? 0),
        }}
      >
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
        <p
          className={cn(styles.text, fontsMap[cardStyle.fontFamily].className)}
          style={{
            color: swapColor(cardModuleColor?.text, colorPalette),
            fontSize: cardStyle.fontSize,
            ...getTextAlignmentStyle(module.variant),
          }}
        >
          {text ?? DEFAULT_MODULE_TEXT}
        </p>
      </div>
    </div>
  );
};

export default TitleTextRenderer;

const getTextAlignmentStyle = (variant: string | null) => {
  switch (variant) {
    case 'left':
      return { textAlign: 'left' as const };
    case 'right':
      return { textAlign: 'right' as const };
    case 'center':
      return { textAlign: 'center' as const };
    case 'justified':
      return { textAlign: 'justify' as const };
    default:
      return { textAlign: 'left' as const };
  }
};

const getTitleAlignmentStyle = (variant: string | null) => {
  //specific case for title
  if (variant === 'justified') {
    return { textAlign: 'left' as const };
  }
  return getTextAlignmentStyle(variant);
};
