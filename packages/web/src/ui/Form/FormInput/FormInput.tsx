import cn from 'classnames';
import { forwardRef, useRef, type InputHTMLAttributes } from 'react';
import ConditionalWrapper from '#components/ConditionalWrapper';
import FormLabel from '../FormLabel/FormLabel';
import styles from './FormInput.css';

type FormInputProps = InputHTMLAttributes<HTMLInputElement> &
  (
    | { withLabel: true; labelText: string }
    | { withLabel?: false; labelText?: never }
  );

let idCounter = 0;
const generateUniqueId = () => `form-input-${idCounter++}-${Date.now()}`;

// eslint-disable-next-line react/display-name
const FormInput = forwardRef<HTMLInputElement, FormInputProps>((props, ref) => {
  const {
    className,
    id: providedId,
    withLabel = false,
    labelText,
    ...others
  } = props;
  const classnames = cn(styles.input, className);

  const inputId = useRef(
    providedId || (withLabel ? generateUniqueId() : undefined),
  ).current;

  return (
    <ConditionalWrapper
      condition={withLabel}
      wrapper={children => (
        <FormLabel htmlFor={inputId} labelText={labelText}>
          {children}
        </FormLabel>
      )}
    >
      <input {...others} className={classnames} ref={ref} id={inputId} />
    </ConditionalWrapper>
  );
});

export default FormInput;
