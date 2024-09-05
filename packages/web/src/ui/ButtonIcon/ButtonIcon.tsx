import cn from 'classnames';

import styles from './ButtonIcon.css';
import type { ComponentType, HTMLAttributes } from 'react';

type ButtonIconProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  Icon: ComponentType<Omit<HTMLAttributes<HTMLDivElement>, 'children'>>;
  iconClassName?: string;
  size?: number;
  width?: number;
  height?: number;
};

const ButtonIcon = (props: ButtonIconProps) => {
  const {
    size = 24,
    Icon,
    className,
    color = 'black',
    iconClassName,
    width,
    height,
    children,
    ...others
  } = props;

  const classnames = cn(styles.buttonIcon, className);

  return (
    <button
      style={{
        width: width ?? (children ? undefined : size),
        height: height ?? (children ? undefined : size),
      }}
      className={classnames}
      {...others}
    >
      <Icon
        color={color}
        style={{ width: size, height: size }}
        className={iconClassName}
      />
      {children}
    </button>
  );
};

export default ButtonIcon;
