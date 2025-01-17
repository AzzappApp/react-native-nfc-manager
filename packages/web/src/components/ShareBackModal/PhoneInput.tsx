import { getInputProps } from '@conform-to/react';
import cn from 'classnames';
import { forwardRef, useRef, useState, type InputHTMLAttributes } from 'react';
import ConditionalWrapper from '#components/ConditionalWrapper';
import EmailOrPhonenumberSelect from '#components/EmailOrPhonenumberSelect';
import styles from '#ui/Form/FormInput/FormInput.css';
import FormLabel from '#ui/Form/FormLabel/FormLabel';
import type { phoneNumberSchemaType } from './shareBackFormSchema';
import type { FieldMetadata } from '@conform-to/react';

type PhoneInputProps = InputHTMLAttributes<HTMLInputElement> & {
  field: FieldMetadata<phoneNumberSchemaType>;
} & (
    | { withLabel: true; labelText: string }
    | { withLabel?: false; labelText?: never }
  );

let idCounter = 0;
const generateUniqueId = () => `form-input-${idCounter++}-${Date.now()}`;

// eslint-disable-next-line react/display-name
const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (props, ref) => {
    const {
      field,
      className,
      id: providedId,
      withLabel = false,
      labelText,
      ...others
    } = props;
    const [countryCode, setCountryCode] = useState('');
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
        <EmailOrPhonenumberSelect
          value={countryCode}
          onChange={setCountryCode}
        />

        <input
          {...getInputProps(field.getFieldset().number, { type: 'text' })}
          {...others}
          className={classnames}
          ref={ref}
          id={inputId}
        />
        <input
          {...getInputProps(field.getFieldset().countryCode, {
            type: 'hidden',
          })}
          value={countryCode}
        />
      </ConditionalWrapper>
    );
  },
);

export default PhoneInput;
