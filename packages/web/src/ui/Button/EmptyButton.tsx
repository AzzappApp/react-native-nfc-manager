'use client';
import cn from 'classnames';
import styles from './Button.css';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const EmptyButton = (props: ButtonProps) => {
  const { className, ...others } = props;

  const classnames = cn(className, styles.empty);

  return <button {...others} className={classnames} />;
};

export default EmptyButton;
