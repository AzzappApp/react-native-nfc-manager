import cn from 'classnames';
import styles from './Button.css';
import EmptyButton from './EmptyButton';
import LinkButton from './LinkButton';
import type { MouseEventHandler } from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  size?: 'large' | 'medium' | 'none' | 'small';
  disabled?: boolean;
  loading?: boolean;
};

const Button = (props: ButtonProps) => {
  const {
    className,
    variant = 'primary',
    size = 'medium',
    disabled,
    loading,
    onClick,
    ...others
  } = props;

  const classnames = cn(styles.button, className, {
    [styles.primary]: variant === 'primary',
    [styles.primaryDisabled]: variant === 'primary' && disabled,
    [styles.small]: size === 'small',
    [styles.medium]: size === 'medium',
    [styles.large]: size === 'large',
    [styles.none]: size === 'none',
  });

  const handleClick: MouseEventHandler<HTMLButtonElement> = event => {
    if (!disabled && !loading) onClick?.(event);
  };

  return (
    <button
      {...others}
      onClick={handleClick}
      className={classnames}
      {...(disabled || loading ? { disabled: true } : {})}
    />
  );
};

Button.Link = LinkButton;
Button.Empty = EmptyButton;

export default Button;
