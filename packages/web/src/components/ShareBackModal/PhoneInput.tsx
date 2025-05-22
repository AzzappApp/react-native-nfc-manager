import { getInputProps, useInputControl } from '@conform-to/react';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import {
  forwardRef,
  useCallback,
  useState,
  type InputHTMLAttributes,
  type ChangeEvent,
} from 'react';
import { useIntl } from 'react-intl';
import { useDebouncedCallback } from 'use-debounce';
import ConditionalWrapper from '#components/ConditionalWrapper';
import EmailOrPhonenumberSelect from '#components/EmailOrPhonenumberSelect';
import FormLabel from '#ui/Form/FormLabel/FormLabel';
import Input from '#ui/Form/Input';
import type { phoneNumberSchemaType } from './shareBackFormSchema';
import type { FieldMetadata } from '@conform-to/react';
import type { CountryCode, PhoneNumber } from 'libphonenumber-js';

type PhoneInputProps = InputHTMLAttributes<HTMLInputElement> & {
  field: FieldMetadata<phoneNumberSchemaType>;
} & (
    | { withLabel: true; labelText: string }
    | { withLabel?: false; labelText?: never }
  );

// eslint-disable-next-line react/display-name
const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ field, className, withLabel = false, labelText, ...others }, ref) => {
    const intl = useIntl();
    const countryCode = useInputControl(field.getFieldset().countryCode);
    const number = useInputControl(field.getFieldset().number);
    const inputProps = getInputProps(field.getFieldset().number, {
      type: 'text',
    });
    const [value, setValue] = useState(number.value || '');

    const parseNumber = useCallback(
      (numberToParse?: string) => {
        try {
          const phone = parsePhoneNumberWithError(numberToParse || '', {
            defaultCountry: countryCode.value as CountryCode,
          });

          return phone;
        } catch (e) {
          console.warn(e);
          return undefined;
        }
      },
      [countryCode.value],
    );

    const [parsedPhoneNumber, setParsedPhoneNumber] = useState<
      PhoneNumber | undefined
    >(() => {
      return parseNumber(number.value);
    });

    const debounced = useDebouncedCallback(val => {
      const parsedNumber = parseNumber(val);
      setParsedPhoneNumber(parsedNumber);
      number.change(parsedPhoneNumber?.number ?? val);
    }, 300);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setParsedPhoneNumber(undefined);
      debounced(event.target.value);
      setValue(newValue);
    };

    return (
      <ConditionalWrapper
        condition={withLabel}
        wrapper={children => (
          <FormLabel htmlFor={inputProps.id} labelText={labelText}>
            {children}
          </FormLabel>
        )}
      >
        <EmailOrPhonenumberSelect
          value={countryCode.value || ''}
          onChange={countryCode.change}
        />

        <Input
          ref={ref}
          {...inputProps}
          prefix={
            parsedPhoneNumber ? `+${parsedPhoneNumber.countryCallingCode}` : ''
          }
          key={inputProps.key}
          onChange={handleChange}
          placeholder={intl.formatMessage({
            id: 'XjhsOn',
            defaultMessage: 'Enter a phone number',
            description: 'Phone input placeHolder',
          })}
          inputClassName={className}
          error={!!field.errors}
          value={parsedPhoneNumber?.nationalNumber || value}
          {...others}
        />
      </ConditionalWrapper>
    );
  },
);

export default PhoneInput;
