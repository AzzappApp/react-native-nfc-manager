'use client';

import classNames from 'classnames';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import Image from 'next/image';
import { useEffect, type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import COUNTRY_FLAG from '@azzapp/shared/CountryFlag';
import { textSmall } from '#app/[userName]/theme.css';
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
  const locale = new Intl.DisplayNames([countryCode], { type: 'region' });
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
  const browserCountryCode =
    new Intl.Locale(
      (typeof navigator !== 'undefined'
        ? navigator
        : { language: DEFAULT_LOCALE }
      )?.language,
    ).region?.toUpperCase() || 'FR';

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
