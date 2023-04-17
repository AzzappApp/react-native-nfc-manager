/* eslint-disable @typescript-eslint/no-var-requires */
import i18nCountries from 'i18n-iso-countries';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import { useCallback, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import { getLocales, useCurrentLocale } from '#helpers/localeHelpers';
import Text from '#ui/Text';
import SelectList from './../SelectList';
import COUNTRY_FLAG from './CountryFlag';
import type { SelectListItemInfo, SelectListProps } from './../SelectList';
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
      getItemLayout={getItemLayout}
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

const ITEM_HEIGHT = 46;
const styles = StyleSheet.create({
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ITEM_HEIGHT,
    paddingLeft: 20,
    paddingRight: 20,
  },
  countryName: {
    flex: 1,
    marginLeft: 10,
  },
  countryCallingCode: {
    marginLeft: 10,
    color: colors.grey400,
  },
});

const renderItem = ({
  item: { callingCode, name, code },
}: SelectListItemInfo<CountryItem>) => {
  return (
    <View style={styles.countryItem}>
      <Image
        source={{ uri: COUNTRY_FLAG[code] }}
        style={{ width: 22, height: 16, borderRadius: 2 }}
      />
      <Text variant="button" style={styles.countryName}>
        {name}
      </Text>
      <Text
        variant="button"
        style={styles.countryCallingCode}
      >{`+${callingCode}`}</Text>
    </View>
  );
};

const getItemLayout = (_data: any, index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});
