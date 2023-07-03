import cx from 'classnames';
import { getImageURL } from '@azzapp/shared/imagesHelpers';
import styles from './CardModuleBackground.module.css';

type CardModuleBackgroundProps = React.HTMLProps<HTMLDivElement> & {
  backgroundId?: string | null;
  backgroundStyle?: {
    backgroundColor?: string | null;
    patternColor?: string | null;
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
  const { backgroundColor, patternColor } = backgroundStyle ?? {};
  return (
    <div
      style={{
        ...style,
        backgroundColor: backgroundColor ?? '#FFF',
        position: 'relative',
      }}
      {...props}
    >
      {backgroundId && (
        <div
          style={{
            backgroundColor: patternColor ?? '#000',
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
