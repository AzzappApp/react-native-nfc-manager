'use client';

import classNames from 'classnames';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import Image from 'next/image';
import { useEffect, type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import COUNTRY_FLAG from '@azzapp/shared/CountryFlag';
import { textSmall } from '#app/theme.css';
import Select from '#components/Select';
import {
  countryCallingCode,
  openedContainer,
  selectContainer,
} from './EmailOrPhonenumberSelect.css';
import type { CountryCode } from 'libphonenumber-js';

export type Option<T extends number | string> = {
  value: T;
  label: string;
  selectLabel?: string;
  left?: ReactNode;
  right?: ReactNode;
};

const getCountryOption = (countryCode: CountryCode) => {
  const callingCode = getCountryCallingCode(countryCode);
  const locale = new Intl.DisplayNames(['en-US'], {
    type: 'region',
    localeMatcher: 'lookup',
  });
  const countryName = locale.of(countryCode);

  return {
    value: countryCode,
    label: countryName as string,
    selectLabel: '',
    left: (
      <Image
        src={COUNTRY_FLAG[countryCode]}
        alt={countryCode}
        height={24}
        width={24}
      />
    ),
    right: (
      <div
        className={classNames(textSmall, countryCallingCode)}
      >{`+${callingCode}`}</div>
    ),
  };
};

type Props = {
  value: string;
  onChange: (countryCode: string) => void;
  withEmail?: boolean;
};

const EmailOrPhonenumberSelect = ({
  value,
  onChange,
  withEmail = false,
}: Props) => {
  const intl = useIntl();
  let language =
    (typeof navigator !== 'undefined' ? navigator.language : null) ??
    DEFAULT_LOCALE;
  language = LANG_MAP[language] ?? language;
  if (/.*[0-9]+.*/.test(language)) {
    language = language.split('-')[0];
  }
  if (/.*[0-9]+.*/.test(language)) {
    language = 'en-US';
  }
  const browserCountryCode =
    new Intl.Locale(language).region?.toUpperCase() || 'US';

  useEffect(() => {
    if (!value) {
      onChange(browserCountryCode);
    }
  }, [browserCountryCode, onChange, value]);

  const countrieCodes = getCountries();
  let options: Array<Option<string>> = [];

  if (withEmail) {
    options = [
      {
        value: '',
        label: intl.formatMessage({
          id: 'hitIrC',
          defaultMessage: 'Email address',
          description: 'Email address label in email or phonenumber select',
        }),
        left: <Image src="/mail.svg" alt="mail" width={24} height={20} />,
        selectLabel: '',
      },
    ];
  }
  options = [
    ...options,
    getCountryOption(browserCountryCode as CountryCode),
    ...countrieCodes
      .filter(countryCode => countryCode !== browserCountryCode)
      .map(getCountryOption)
      .sort(({ label: label1 }, { label: label2 }) =>
        label1.localeCompare(label2),
      ),
  ];

  return (
    <Select
      value={value}
      options={options}
      onChange={onChange}
      openBoxClassName={openedContainer}
      childrenOnTop
      className={selectContainer}
    />
  );
};

export default EmailOrPhonenumberSelect;

const LANG_MAP: Record<string, string> = {
  'es-419': 'es-AR', // Spanish (Latin America)
  'ar-001': 'ar-EG', // Arabic (Egypt)
  'en-001': 'en-US', // English (United States)
  'en-150': 'en-GB', // English (United Kingdom)
  'yi-001': 'yi', // Yiddish
};
