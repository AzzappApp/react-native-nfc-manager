import { getInputProps } from '@conform-to/react';
import cn from 'classnames';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';
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

// eslint-disable-next-line react/display-name
const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (props, ref) => {
    const { field, className, withLabel = false, labelText, ...others } = props;
    const [countryCode, setCountryCode] = useState('');
    const classnames = cn(styles.input, className);
    const numberInputProps = getInputProps(field.getFieldset().number, {
      type: 'text',
    });

    return (
      <ConditionalWrapper
        condition={withLabel}
        wrapper={children => (
          <FormLabel htmlFor={numberInputProps.id} labelText={labelText}>
            {children}
          </FormLabel>
        )}
      >
        <EmailOrPhonenumberSelect
          value={countryCode}
          onChange={setCountryCode}
        />

        <input
          {...numberInputProps}
          {...others}
          className={classnames}
          ref={ref}
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
