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
};

const CardModuleBackground = ({
  backgroundId,
  backgroundStyle,
  children,
  style,
  containerStyle,
  containerClassName,
  ...props
}: CardModuleBackgroundProps) => {
  const {
    backgroundColor,
    patternColor,
    opacity = 100,
  } = backgroundStyle ?? {};

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
            backgroundColor: convertHexToRGBA(patternColor ?? '#FFF', opacity),
            WebkitMaskImage: `url(${getImageURL(backgroundId)}.svg)`,
            maskImage: `url(${getImageURL(backgroundId)}.svg)`,
          }}
          className={styles.background}
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
