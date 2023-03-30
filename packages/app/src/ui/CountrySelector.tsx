/* eslint-disable @typescript-eslint/no-var-requires */
import i18nCountries from 'i18n-iso-countries';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CountryFlag from 'react-native-country-flag';
import { colors, fontFamilies } from '#theme';
import { getLocales, useCurrentLocale } from '#helpers/localeHelpers';
import SelectList from './SelectList';
import type { SelectListItemInfo, SelectListProps } from './SelectList';
import type { CountryCode } from 'libphonenumber-js';

//TODO FIND a way to get the locales from the SUPPORTED_LOCALES
i18nCountries.registerLocale(require('i18n-iso-countries/langs/en.json'));
i18nCountries.registerLocale(require('i18n-iso-countries/langs/fr.json'));

type CountrySelectorProps = Omit<
  SelectListProps<CountryItem>,
  'data' | 'keyExtractor' | 'onItemSelected' | 'renderItem' | 'selectedItemKey'
> & {
  value: CountryCode | null | undefined;
  onChange: (country: CountryCode) => void;
};

const CountrySelector = ({
  value,
  onChange,
  ...props
}: CountrySelectorProps) => {
  const locale = useCurrentLocale();

  const countries = useMemo<CountryItem[]>(() => {
    const countries = getCountries();
    const locales = getLocales();
    const localesCountries = new Map(
      locales.map((locale, index) => [locale.countryCode, index]),
    );
    return countries
      .map(country => {
        const name = i18nCountries.getName(country, locale);
        const callingCode = getCountryCallingCode(country);
        return { callingCode, name, code: country };
      })
      .filter(country => !!country.name)
      .sort((a, b) => {
        if (localesCountries.has(a.code) && !localesCountries.has(b.code)) {
          return -1;
        }
        if (!localesCountries.has(a.code) && localesCountries.has(b.code)) {
          return 1;
        }
        if (localesCountries.has(a.code) && localesCountries.has(b.code)) {
          return localesCountries.get(a.code)! - localesCountries.get(b.code)!;
        }
        return a.name.localeCompare(b.name);
      });
  }, [locale]);

  const keyExtractor = useCallback((item: CountryItem) => item.code, []);

  const renderItem = useCallback(
    ({
      item: { callingCode, name, code },
    }: SelectListItemInfo<CountryItem>) => {
      return (
        <View style={styles.countryItem}>
          <CountryFlag isoCode={code} size={18} />
          <Text style={styles.countryName}>{name}</Text>
          <Text style={styles.countryCallingCode}>{`+${callingCode}`}</Text>
        </View>
      );
    },
    [],
  );

  const onItemSelected = useCallback(
    (country: CountryItem) => {
      onChange(country.code);
    },
    [onChange],
  );

  return (
    <SelectList
      data={countries}
      keyExtractor={keyExtractor}
      selectedItemKey={value}
      renderItem={renderItem}
      onItemSelected={onItemSelected}
      {...props}
    />
  );
};

export default CountrySelector;

type CountryItem = {
  callingCode: string;
  name: string;
  code: CountryCode;
};

const styles = StyleSheet.create({
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  countryName: {
    ...fontFamilies.semiBold,
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  countryCallingCode: {
    marginLeft: 10,
    color: colors.grey400,
  },
});
