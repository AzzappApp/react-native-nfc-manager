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
import ConditionalWrapper from '#components/ConditionalWrapper';
import EmailOrPhonenumberSelect from '#components/EmailOrPhonenumberSelect';
import FormLabel from '#ui/Form/FormLabel/FormLabel';
import Input from '#ui/Form/Input';
import type { FieldMetadata, SubmissionResult } from '@conform-to/react';
import type { CountryCode, PhoneNumber } from 'libphonenumber-js';

type PhoneInputProps = InputHTMLAttributes<HTMLInputElement> & {
  number: FieldMetadata<string>;
  countryCode: FieldMetadata<string>;
} & { lastResult?: SubmissionResult | null } & (
    | { withLabel: true; labelText: string }
    | { withLabel?: false; labelText?: never }
  );

// eslint-disable-next-line react/display-name
const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      number: numberField,
      countryCode: countryCodeField,
      className,
      withLabel = false,
      labelText,
      lastResult,
      ...others
    },
    ref,
  ) => {
    const intl = useIntl();
    const countryCode = useInputControl(countryCodeField);
    const number = useInputControl(numberField);
    const inputProps = getInputProps(numberField, {
      type: 'text',
    });

    const parseNumber = useCallback(
      (numberToParse?: string) => {
        try {
          const phone = parsePhoneNumberWithError(numberToParse || '', {
            defaultCountry: (countryCode.value ||
              lastResult?.initialValue?.countryCode.toString()) as CountryCode,
          });

          return phone;
        } catch (e) {
          console.warn(e);
          return undefined;
        }
      },
      [countryCode.value, lastResult?.initialValue?.countryCode],
    );

    const [parsedPhoneNumber, setParsedPhoneNumber] = useState<
      PhoneNumber | undefined
    >(() => {
      return parseNumber(
        number.value || lastResult?.initialValue?.number.toString(),
      );
    });

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      setParsedPhoneNumber(undefined);
      const val = event.target.value;
      const parsedNumber = parseNumber(
        val || lastResult?.initialValue?.number.toString(),
      );
      setParsedPhoneNumber(parsedNumber);
      number.change(parsedPhoneNumber?.number ?? val);
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
          value={
            countryCode.value ||
            lastResult?.initialValue?.countryCode.toString() ||
            ''
          }
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
          error={!!numberField.errors}
          value={lastResult?.initialValue?.number.toString() || undefined}
          {...others}
        />
      </ConditionalWrapper>
    );
  },
);

export default PhoneInput;
