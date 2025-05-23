import { Dimensions, Image, View } from 'react-native';
import COUNTRY_FLAG from '@azzapp/shared/CountryFlag';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useBoolean from '#hooks/useBoolean';
import BottomSheetModal from '#ui/BottomSheetModal';
import Text from '#ui/Text';
import CountrySelector from './CountrySelector';
import Icon from './Icon';
import PressableBackground from './PressableBackground';
import PressableNative from './PressableNative';
import type { Icons } from './Icon';
import type { CountryCode } from 'libphonenumber-js';
import type { RefObject } from 'react';
import type { TextInput, ViewProps } from 'react-native';

export type CountryCodeListOption<T extends string> = {
  type: T;
  title: string;
  icon: Icons;
};

type CountryCodeListWithOptionsProps<T extends string> = Omit<
  ViewProps,
  'style'
> & {
  otherSectionTitle?: string;
  options: Array<CountryCodeListOption<T>>;
  phoneSectionTitle: string;
  value: CountryCode | T;
  inputRef?: RefObject<TextInput | null>;
  onChange: (value: CountryCode | T) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onDismiss?: () => void;
};

const { height: windowHeight } = Dimensions.get('window');

const CountryCodeListWithOptions = <T extends string>({
  phoneSectionTitle,
  otherSectionTitle,
  options,
  value,
  inputRef,
  onChange,
  onClose,
  onOpen,
  onDismiss,
  ...props
}: CountryCodeListWithOptionsProps<T>) => {
  const [showDropdown, openDropDown, closeDropDown] = useBoolean(false);
  const onButtonPress = () => {
    openDropDown();
    onOpen?.();
  };

  const onRequestClose = () => {
    closeDropDown();
    onClose?.();
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 50);
  };

  const onSelect = (value: CountryCode | T) => {
    onChange(value);
    onRequestClose();
  };

  const styles = useStyleSheet(styleSheet);

  const isSelectorType = () => {
    return options.some(option => option.type === value);
  };

  const selectorIcon = () => {
    return options.find(option => option.type === value)?.icon;
  };

  return (
    <>
      <View style={styles.buttonContainer}>
        <PressableNative
          {...props}
          onPress={onButtonPress}
          accessibilityRole="button"
          style={styles.button}
        >
          {isSelectorType() ? (
            <Icon icon={selectorIcon()!} style={[{ width: 24 }, styles.icon]} />
          ) : (
            <Image
              source={{ uri: COUNTRY_FLAG[value as CountryCode] }}
              style={styles.country}
            />
          )}
          <Icon icon="arrow_down" style={styles.chevronDown} />
        </PressableNative>
      </View>
      {showDropdown && (
        <BottomSheetModal
          visible={showDropdown}
          height={windowHeight - 120}
          onDismiss={onRequestClose}
          dismissKeyboardOnOpening
        >
          <CountrySelector
            value={isSelectorType() ? null : (value as CountryCode)}
            onChange={onSelect}
            ListHeaderComponent={
              <View>
                {otherSectionTitle ? (
                  <Text variant="large" style={styles.section}>
                    {otherSectionTitle}
                  </Text>
                ) : null}
                {options.map(({ type, title, icon }) => {
                  return (
                    <PressableBackground
                      key={type}
                      highlightColor={colors.grey400}
                      onPress={() => onSelect(type)}
                      style={[
                        styles.emailItem,
                        value === type && styles.emailItemSelected,
                      ]}
                    >
                      <Icon icon={icon} />
                      <Text variant="button" style={styles.emailItemName}>
                        {title}
                      </Text>
                    </PressableBackground>
                  );
                })}
                <Text variant="large" style={styles.section}>
                  {phoneSectionTitle}
                </Text>
              </View>
            }
          />
        </BottomSheetModal>
      )}
    </>
  );
};
export default CountryCodeListWithOptions;

const styleSheet = createStyleSheet(appearance => ({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: 6,
    width: 50,
    height: 47,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
  },
  buttonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  country: { width: 22, height: 16 },
  icon: {
    tintColor: appearance === 'light' ? colors.black : colors.white,
  },
  chevronDown: { width: 9 },
  bottomSheetContainer: {
    marginTop: 10,
    paddingHorizontal: 0,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  emailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 30,
    marginBottom: 18,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  emailItemSelected: {
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
  },
  emailItemName: {
    flex: 1,
    marginLeft: 14,
  },
  section: {
    marginBottom: 35,
    paddingHorizontal: 20,
  },
}));
