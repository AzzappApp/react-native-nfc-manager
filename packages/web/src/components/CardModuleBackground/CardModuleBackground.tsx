import cx from 'classnames';
import { getCldImageUrl } from 'next-cloudinary';
import { swapColor, type ColorPalette } from '@azzapp/shared/cardHelpers';
import { convertHexToRGBA } from '@azzapp/shared/colorsHelpers';
import styles from './CardModuleBackground.css';

type CardModuleBackgroundProps = React.HTMLProps<HTMLDivElement> & {
  backgroundId?: string | null;
  backgroundStyle?: {
    backgroundColor?: string | null;
    patternColor?: string | null;
    opacity?: number;
  } | null;
  containerStyle?: React.CSSProperties;
  containerClassName?: string;
  colorPalette: ColorPalette;
  resizeModes?: Map<string, string>;
};

const CardModuleBackground = ({
  backgroundId,
  backgroundStyle,
  children,
  style,
  containerStyle,
  containerClassName,
  colorPalette,
  resizeModes,
  ...props
}: CardModuleBackgroundProps) => {
  const {
    backgroundColor,
    patternColor,
    opacity = 100,
  } = backgroundStyle ?? {};

  const resizeMode =
    backgroundId && resizeModes?.get
      ? resizeModes?.get?.(backgroundId)
      : 'cover';

  const classnames = cx({
    [styles.background]: true,
    [styles.backgroundCover]: resizeMode === 'cover',
    [styles.backgroundContain]: resizeMode === 'contain',
    [styles.backgroundCenter]: resizeMode === 'center',
    [styles.backgroundRepeat]: resizeMode === 'repeat',
    [styles.backgroundStretch]: resizeMode === 'stretch',
  });

  return (
    <div
      style={{
        ...style,
        backgroundColor: convertHexToRGBA(
          swapColor(backgroundColor, colorPalette) ?? '#FFF',
          opacity,
        ),
        position: 'relative',
      }}
      {...props}
    >
      {backgroundId && (
        <div
          style={{
            backgroundColor: convertHexToRGBA(
              swapColor(patternColor, colorPalette) ?? '#000',
              opacity,
            ),
            maskImage: `url(${getCldImageUrl({
              src: backgroundId,
              format: 'svg',
            })})`,
          }}
          className={classnames}
        />
      )}
      <div
        className={cx(styles.content, containerClassName)}
        style={containerStyle}
      >
        {children}
      </div>
    </div>
  );
};

export default CardModuleBackground;
