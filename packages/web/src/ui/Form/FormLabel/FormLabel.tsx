import cn from 'classnames';
import { forwardRef, type LabelHTMLAttributes } from 'react';

import styles from './FormLabel.css';

type FormLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  labelText?: string;
};

// eslint-disable-next-line react/display-name
const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>((props, ref) => {
  const { className, labelText, children, ...others } = props;
  const classnames = cn(styles.label, className);

  return (
    <>
      <label {...others} className={classnames} ref={ref}>
        {labelText}
      </label>
      {children}
    </>
  );
});

export default FormLabel;
