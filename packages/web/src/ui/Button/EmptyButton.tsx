'use client';
import cn from 'classnames';
import { forwardRef } from 'react';
import styles from './Button.css';
import type { ForwardedRef } from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const EmptyButton = (
  props: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) => {
  const { className, ...others } = props;

  const classnames = cn(className, styles.empty, styles.none);

  return <button ref={ref} {...others} className={classnames} />;
};

export default forwardRef(EmptyButton);
