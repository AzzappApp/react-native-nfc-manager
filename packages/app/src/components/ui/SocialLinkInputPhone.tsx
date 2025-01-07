import parsePhoneNumberFromString from 'libphonenumber-js';
import { memo, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  View,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputEndEditingEventData,
} from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import { useCurrentLocale } from '#helpers/localeHelpers';
import CountryCodeListWithOptions from '#ui/CountryCodeListWithOptions';
import Input from '#ui/Input';
import type { SocialLinkItemType } from '@azzapp/shared/socialLinkHelpers';
import type { CountryCode } from 'libphonenumber-js';

type SocialLinkInputPhoneProps = {
  // type of social. allow to display the correct prefix
  linkType: SocialLinkItemType;
  // notify input value change
  onChangeLink: (value: string) => void;
  // default value to display in the text field
  defaultValue: string;
  // allow to display to red border in case of error
  isErrored?: boolean;
  // notify when user change contry code
  onCountryCodeChange: (countryCode: CountryCode) => void;
};

// infer phone country code from current local
const useDefaultCountryCode = () => {
  const defaultCountryCode = useCurrentLocale();
  return defaultCountryCode.slice(0, 2).toUpperCase() as CountryCode;
};

/*
 * input text for social link configuration
 * defaultValue is a full phone number
 * onChangeLink with report the new value
 */

const SocialLinkInputPhone = ({
  linkType,
  onChangeLink,
  defaultValue,
  onCountryCodeChange,
  isErrored,
}: SocialLinkInputPhoneProps) => {
  const intl = useIntl();

  const parsedNumber = useMemo(() => {
    return parsePhoneNumberFromString(defaultValue);
  }, [defaultValue]);

  const [localValue, setLocalValue] = useState(parsedNumber?.number as string);

  const debouncedChangeLink = useDebouncedCallback(onChangeLink, 500, {
    leading: true,
  });

  const onChangeText = useCallback(
    (value: string) => {
      value = value.trim().replace(' ', '');
      setLocalValue(value);
      debouncedChangeLink(value);
    },
    [debouncedChangeLink],
  );
  const currentLanguageLocale = useDefaultCountryCode();

  const [countryCode, setCountryCode] = useState<CountryCode>(() => {
    const newCode = parsedNumber?.country || currentLanguageLocale;
    onCountryCodeChange(newCode);
    return newCode;
  });

  const onEndEditing = useCallback(
    async (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
      onChangeLink(e.nativeEvent.text);
    },
    [onChangeLink],
  );

  const onCountryCodeChangeInner = (newCountryCode: string) => {
    setCountryCode(newCountryCode as CountryCode);
    onCountryCodeChange(newCountryCode as CountryCode);
  };

  return (
    <>
      <View key={linkType.id} style={styles.inputContainer}>
        <CountryCodeListWithOptions
          phoneSectionTitle={intl.formatMessage({
            defaultMessage: 'Select your country',
            description:
              'Link configuration - Section title in country selection list',
          })}
          value={countryCode}
          options={[]}
          onChange={onCountryCodeChangeInner}
        />
        <Input
          value={localValue}
          onChangeText={onChangeText}
          onEndEditing={onEndEditing}
          style={styles.inputStyle}
          autoCapitalize="none"
          keyboardType="phone-pad"
          enterKeyHint="done"
          isErrored={isErrored}
          autoFocus
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 10,
    flex: 1,
  },
  inputStyle: { flex: 1, marginStart: 5 },
});

export default memo(SocialLinkInputPhone);
