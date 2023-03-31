import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamilies } from '#theme';
import useViewportSize, { VH100 } from '#hooks/useViewportSize';
import BottomSheetModal from '#ui/BottomSheetModal';
import CountrySelector from './CountrySelector';
import COUNTRY_FLAG from './CountrySelector/CountryFlag';
import Icon from './Icon';
import PressableBackground from './PressableBackground';
import PressableNative from './PressableNative';
import type { CountryCode } from 'libphonenumber-js';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type EmailOrCountryCodeSelectorProps = ViewProps & {
  emailSectionTitle: string;
  phoneSectionTitle: string;
  value: CountryCode | 'email';
  onChange: (value: CountryCode | 'email') => void;
};

const EmailOrCountryCodeSelector = ({
  emailSectionTitle,
  phoneSectionTitle,
  value,
  onChange,
  style,
  ...props
}: EmailOrCountryCodeSelectorProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const onSelect = (value: CountryCode | 'email') => {
    onChange(value);
    setShowDropdown(false);
  };
  const vp = useViewportSize();
  const intl = useIntl();
  return (
    <>
      <PressableNative
        {...props}
        onPress={() => setShowDropdown(true)}
        style={[styles.button, style]}
        accessibilityRole="button"
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Select a calling code or email',
          description: 'The accessibility label for the country selector',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage:
            'Opens a list of countries and email address and allows you to select if you want to use your email address or a phone number',
          description: 'The accessibility hint for the country selector',
        })}
      >
        {value === 'email' ? (
          <Icon icon="mail" style={{ width: 24 }} />
        ) : (
          <Image
            source={{ uri: COUNTRY_FLAG[value] }}
            style={{ width: 22, height: 16 }}
          />
        )}
      </PressableNative>
      <BottomSheetModal
        visible={showDropdown}
        height={vp`${VH100} -${120}`}
        contentContainerStyle={styles.bottomSheetContainer}
        onRequestClose={() => setShowDropdown(false)}
      >
        <CountrySelector
          value={value === 'email' ? null : value}
          onChange={onSelect}
          ListHeaderComponent={
            <View>
              <Text style={styles.section}>{emailSectionTitle}</Text>
              <PressableBackground
                onPress={() => onSelect('email')}
                style={[
                  styles.emailItem,
                  value === 'email' && styles.emailItemSelected,
                ]}
              >
                <Icon icon="mail" style={{ width: 24 }} />
                <Text style={styles.emailItemName}>
                  <FormattedMessage
                    defaultMessage="Email address"
                    description="The email address option in the country selector"
                  />
                </Text>
              </PressableBackground>
              <Text style={styles.section}>{phoneSectionTitle}</Text>
            </View>
          }
        />
      </BottomSheetModal>
    </>
  );
};
export default EmailOrCountryCodeSelector;

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 43,
    backgroundColor: colors.grey50,
    borderRadius: 12,
  },
  bottomSheetContainer: {
    marginTop: 10,
    paddingHorizontal: 0,
  },
  emailItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 30,
    marginBottom: 18,
  },
  emailItemName: {
    ...fontFamilies.semiBold,
    flex: 1,
    marginLeft: 14,
    fontSize: 14,
  },
  emailItemSelected: {
    backgroundColor: colors.grey50,
  },
  section: {
    ...fontFamilies.semiBold,
    marginBottom: 35,
    paddingHorizontal: 20,
    fontSize: 16,
  },
});
