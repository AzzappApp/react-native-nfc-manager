'use client';

import cn from 'classnames';
import styles from './Button.css';

type ButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  type?: 'primary' | 'secondary';
  size?: 'large' | 'medium' | 'small';
  disabled?: boolean;
};

const LinkButton = (props: ButtonProps) => {
  const {
    className,
    type = 'primary',
    size = 'medium',
    disabled,
    download,
    href,
    ...others
  } = props;

  const classnames = cn(styles.button, className, {
    [styles.primary]: type === 'primary',
    [styles.primaryDisabled]: type === 'primary' && disabled,
    [styles.small]: size === 'small',
    [styles.medium]: size === 'medium',
    [styles.large]: size === 'large',
  });

  return <a {...others} className={classnames} />;
};

export default LinkButton;
