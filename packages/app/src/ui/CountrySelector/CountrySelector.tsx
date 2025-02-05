import i18nCountries from 'i18n-iso-countries';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import { useCallback, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import COUNTRY_FLAG from '@azzapp/shared/CountryFlag';
import { colors } from '#theme';
import { getLocales, useCurrentLocale } from '#helpers/localeHelpers';
import Text from '#ui/Text';
import SelectList from './../SelectList';
import type { SelectListItemInfo, SelectListProps } from './../SelectList';
import type { CountryCode } from 'libphonenumber-js';

i18nCountries.registerLocale(require('i18n-iso-countries/langs/da.json'));
i18nCountries.registerLocale(require('i18n-iso-countries/langs/de.json'));
i18nCountries.registerLocale(require('i18n-iso-countries/langs/en.json'));
i18nCountries.registerLocale(require('i18n-iso-countries/langs/es.json'));
i18nCountries.registerLocale(require('i18n-iso-countries/langs/fr.json'));
i18nCountries.registerLocale(require('i18n-iso-countries/langs/it.json'));
i18nCountries.registerLocale(require('i18n-iso-countries/langs/nl.json'));
i18nCountries.registerLocale(require('i18n-iso-countries/langs/no.json'));
i18nCountries.registerLocale(require('i18n-iso-countries/langs/pt.json'));
i18nCountries.registerLocale(require('i18n-iso-countries/langs/sv.json'));

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
        let name = i18nCountries.getName(country, locale);
        if (!name) {
          //fallback to english
          name = i18nCountries.getName(country, 'en');
        }
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
        return a.name ? (b.name ? a.name.localeCompare(b.name) : 1) : -1;
      });
  }, [locale]);

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

const keyExtractor = (item: CountryItem) => item.code;

export default CountrySelector;

type CountryItem = {
  callingCode: string;
  name?: string;
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
