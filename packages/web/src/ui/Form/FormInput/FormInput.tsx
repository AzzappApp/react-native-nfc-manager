import cn from 'classnames';
import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './FormInput.css';

type FormInputProps = InputHTMLAttributes<HTMLInputElement>;

// eslint-disable-next-line react/display-name
const FormInput = forwardRef<HTMLInputElement, FormInputProps>((props, ref) => {
  const { className, ...others } = props;
  const classnames = cn(styles.input, className);

  return <input {...others} className={classnames} ref={ref} />;
});

export default FormInput;
