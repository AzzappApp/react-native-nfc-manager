import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { SOCIAL_NETWORK_LINKS } from '@azzapp/shared/socialLinkHelpers';
import { colors, textStyles } from '#theme';
import { createStyleSheet } from '#helpers/createStyles';
import type { ColorSchemeName } from 'react-native';

export const DELETE_BUTTON_WIDTH = 70;

const FIELD_HEIGHT = 72;

export const buildContactCardModalStyleSheet = (appareance: ColorSchemeName) =>
  ({
    field: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: FIELD_HEIGHT,
      paddingHorizontal: 20,
      backgroundColor: appareance === 'light' ? 'white' : 'black',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 7,
      height: FIELD_HEIGHT,
      paddingHorizontal: 20,
      backgroundColor: appareance === 'light' ? 'white' : 'black',
    },
    sectionsContainer: {
      rowGap: 1,
      paddingBottom: 20,
      backgroundColor: colors.grey50,
    },
    separator: {
      height: 30,
    },
    input: {
      flex: 1,
      padding: 0,
      backgroundColor: 'transparent',
      borderWidth: 0,
      paddingLeft: 16,
      paddingRight: 0,
      ...textStyles.medium,
    },
  }) as const;

export const contactCardEditModalStyleSheet = createStyleSheet(
  buildContactCardModalStyleSheet,
);

export const useContactCardAddressLabels = () => {
  const intl = useIntl();

  const labelValues = useMemo(
    () => [
      {
        key: 'Home',
        value: intl.formatMessage({
          defaultMessage: 'Home',
          description:
            '"Home" value as type for an address in Contact Card edition',
        }),
      },
      {
        key: 'Work',
        value: intl.formatMessage({
          defaultMessage: 'Work',
          description:
            '"Work" value as type for an address in Contact Card edition',
        }),
      },
      {
        key: 'Main',
        value: intl.formatMessage({
          defaultMessage: 'Main',
          description:
            '"Main" value as type for an address in Contact Card edition',
        }),
      },
      {
        key: 'Other',
        value: intl.formatMessage({
          defaultMessage: 'Other',
          description:
            '"Other" value as type for an address in Contact Card edition',
        }),
      },
    ],
    [intl],
  );

  return labelValues;
};

export const useContactCardEmailLabels = () => {
  const intl = useIntl();

  const labelValues = useMemo(
    () => [
      {
        key: 'Home',
        value: intl.formatMessage({
          defaultMessage: 'Home',
          description:
            '"Home" value as type for an email in Contact Card edition',
        }),
      },
      {
        key: 'Work',
        value: intl.formatMessage({
          defaultMessage: 'Work',
          description:
            '"Work" value as type for an email in Contact Card edition',
        }),
      },
      {
        key: 'Main',
        value: intl.formatMessage({
          defaultMessage: 'Main',
          description:
            '"Main" value as type for an email in Contact Card edition',
        }),
      },

      {
        key: 'Other',
        value: intl.formatMessage({
          defaultMessage: 'Other',
          description:
            '"Other" value as type for an email in Contact Card edition',
        }),
      },
    ],
    [intl],
  );
  return labelValues;
};

export const useContactCardPhoneLabels = () => {
  const intl = useIntl();

  const labelValues = useMemo(
    () => [
      {
        key: 'Home',
        value: intl.formatMessage({
          defaultMessage: 'Home',
          description:
            '"Home" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Work',
        value: intl.formatMessage({
          defaultMessage: 'Work',
          description:
            '"Work" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Mobile',
        value: intl.formatMessage({
          defaultMessage: 'Mobile',
          description:
            '"Mobile" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Main',
        value: intl.formatMessage({
          defaultMessage: 'Main',
          description:
            '"Main" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Fax',
        value: intl.formatMessage({
          defaultMessage: 'Fax',
          description:
            '"Fax" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Other',
        value: intl.formatMessage({
          defaultMessage: 'Other',
          description:
            '"Other" value as type for a phone number in Contact Card edition',
        }),
      },
    ],
    [intl],
  );

  return labelValues;
};

export const useSocialLinkLabels = () => {
  const labelValues = useMemo(
    () =>
      SOCIAL_NETWORK_LINKS.map(socialLink => ({
        key: socialLink.id as string,
        value: socialLink.id as string,
      })),
    [],
  );

  return labelValues;
};
