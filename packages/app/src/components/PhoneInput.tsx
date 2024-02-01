import { parsePhoneNumber, AsYouType } from 'libphonenumber-js';
import { forwardRef, useCallback, useEffect, useState } from 'react';
import TextInput from '#ui/TextInput';
import type { TextInputProps } from '#ui/TextInput';
import type { CountryCode } from 'libphonenumber-js';
import type { ForwardedRef } from 'react';
import type { TextInput as NativeTextInput } from 'react-native';

type PhoneInputProps = TextInputProps & {
  countryCode: CountryCode;
};

/**
 * PhoneInput handle phone with  our TextInput
 */
const PhoneInput = (
  { value, onChangeText, countryCode, ...props }: PhoneInputProps,
  ref: ForwardedRef<NativeTextInput>,
) => {
  const [formattedValue, setFormattedValue] = useState(value);
  useEffect(() => {
    if (countryCode && value) {
      try {
        const parsedInput = parsePhoneNumber(value, countryCode);
        setFormattedValue(parsedInput.formatNational());
      } catch {
        setFormattedValue(value);
      }
    } else {
      setFormattedValue(value);
    }
  }, [countryCode, value]);

  const formatOnChange = useCallback(
    (value: string) => {
      //format the input
      let formatted = value;
      if (countryCode) {
        const asYouType = new AsYouType(countryCode);
        formatted = asYouType.input(value);
      }
      setFormattedValue(formatted);
      if (onChangeText) {
        onChangeText(formatted);
      }
    },
    [countryCode, onChangeText],
  );

  return (
    <TextInput
      ref={ref}
      {...props}
      onChangeText={formatOnChange}
      value={formattedValue}
    />
  );
};

export default forwardRef(PhoneInput);
