import cx from 'classnames';
import { getImageURL } from '@azzapp/shared/imagesHelpers';
import { convertHexToRGBA } from '#helpers';
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
  resizeModes?: Map<string, string>;
};

const CardModuleBackground = ({
  backgroundId,
  backgroundStyle,
  children,
  style,
  containerStyle,
  containerClassName,
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

  const classnames = cx(styles.background, {
    [styles.backgroundCover]: resizeMode === 'cover',
    [styles.backgroundContain]: resizeMode === 'contain',
    [styles.backgroundCenter]: resizeMode === 'center',
    [styles.backgroundRepeat]: resizeMode === 'repeat',
  });

  return (
    <div
      style={{
        ...style,
        backgroundColor: convertHexToRGBA(backgroundColor ?? '#FFF', opacity),
        position: 'relative',
      }}
      {...props}
    >
      {backgroundId && (
        <div
          style={{
            backgroundColor: convertHexToRGBA(
              patternColor ?? '#ff0000',
              opacity,
            ),
            WebkitMaskImage: `url(${getImageURL(backgroundId)}.svg)`,
            maskImage: `url(${getImageURL(backgroundId)}.svg)`,
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
