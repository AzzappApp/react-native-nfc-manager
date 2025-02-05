import cn from 'classnames';
import { forwardRef, type InputHTMLAttributes } from 'react';
import ConditionalWrapper from '#components/ConditionalWrapper';
import FormLabel from '../FormLabel/FormLabel';
import styles from './FormInput.css';

type FormInputProps = InputHTMLAttributes<HTMLInputElement> &
  (
    | { withLabel: true; labelText: string }
    | { withLabel?: false; labelText?: never }
  );

// eslint-disable-next-line react/display-name
const FormInput = forwardRef<HTMLInputElement, FormInputProps>((props, ref) => {
  const { className, withLabel = false, labelText, ...others } = props;
  const classnames = cn(styles.input, className);

  return (
    <ConditionalWrapper
      condition={withLabel}
      wrapper={children => (
        <FormLabel htmlFor={others.id} labelText={labelText}>
          {children}
        </FormLabel>
      )}
    >
      <input {...others} className={classnames} ref={ref} />
    </ConditionalWrapper>
  );
});

export default FormInput;
