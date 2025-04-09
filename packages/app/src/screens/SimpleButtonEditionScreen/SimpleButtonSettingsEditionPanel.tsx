import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useState, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useFragment, graphql } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  SIMPLE_BUTTON_MAX_FONT_SIZE,
  SIMPLE_BUTTON_MAX_LABEL_LENGTH,
  SIMPLE_BUTTON_MIN_FONT_SIZE,
} from '@azzapp/shared/cardModuleHelpers';
import { isPhoneNumber, isValidEmail } from '@azzapp/shared/stringHelpers';
import WebCardColorPicker, {
  WebCardColorDropDownPicker,
} from '#components/WebCardColorPicker';
import useBoolean from '#hooks/useBoolean';
import ColorPreview from '#ui/ColorPreview';
import CountryCodeListWithOptions from '#ui/CountryCodeListWithOptions';
import FontDropDownPicker from '#ui/FontDropDownPicker';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TabsBar from '#ui/TabsBar';
import TextInput from '#ui/TextInput';
import TextInputWithEllipsizeMode from '#ui/TextInputWithEllipsizeMode';
import type { SimpleButtonSettingsEditionPanel_webCard$key } from '#relayArtifacts/SimpleButtonSettingsEditionPanel_webCard.graphql';
import type { CountryCodeListOption } from '#ui/CountryCodeListWithOptions';
import type { CountryCode, PhoneNumber } from 'libphonenumber-js';
import type { KeyboardType, ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

type ActionType = CountryCode | 'email' | 'link';

type SimpleButtonSettingsEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the webCard
   */
  webCard: SimpleButtonSettingsEditionPanel_webCard$key | null;
  /**
   * The buttonLabel currently set on the module
   */
  buttonLabel: string;
  /**
   * A callback called when the user update the buttonLabel
   */
  onButtonLabelChange: (buttonLabel: string) => void;
  /**
   * The actionType currently set on the module
   */
  actionType: string;
  /**
   * A callback called when the user update the actionType
   */
  onActionTypeChange: (actionType: string) => void;
  /**
   * The actionLink currently set on the module
   */
  actionLink: string;
  /**
   * A callback called when the user update the actionLink
   */
  onActionLinkChange: (actionLink: string) => void;
  /**
   * The fontFamily currently set on the module
   */
  fontFamily: string;
  /**
   * A callback called when the user update the fontFamily
   */
  onFontFamilyChange: (fontFamily: string) => void;

  /**
   * The fontColor currently set on the module
   */
  fontColor: string;
  /**
   * A callback called when the user update the fontColor
   */
  onFontColorChange: (fontColor: string) => void;
  /**
   * The fontSize currently set on the module
   */
  fontSize: SharedValue<number>;
  /**
   * The buttonColor currently set on the module
   */
  buttonColor: string;
  /**
   * A callback called when the user update the buttonColor
   */
  onButtonColorChange: (buttonColor: string) => void;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;

  onTouched: () => void;
};

/**
 * A Panel to edit the Settings of the SimpleButton edition screen
 */
const SimpleButtonSettingsEditionPanel = ({
  webCard: webCardKey,
  buttonLabel,
  onButtonLabelChange,
  actionType,
  onActionTypeChange,
  actionLink,
  onActionLinkChange,
  fontFamily,
  onFontFamilyChange,
  fontColor,
  onFontColorChange,
  fontSize,
  buttonColor,
  onButtonColorChange,
  style,
  bottomSheetHeight,
  onTouched,
  ...props
}: SimpleButtonSettingsEditionPanelProps) => {
  const intl = useIntl();
  const [isFocused, focus, unfocus] = useBoolean(false);
  const [phoneNumber, setPhoneNumber] = useState<PhoneNumber | undefined>(
    parsePhoneNumberFromString(actionLink, actionType as CountryCode),
  );

  const [currentTab, setCurrentTab] = useState<string>('settings');
  const webCard = useFragment(
    graphql`
      fragment SimpleButtonSettingsEditionPanel_webCard on WebCard {
        ...WebCardColorPicker_webCard
        cardColors {
          primary
          dark
          light
        }
      }
    `,
    webCardKey,
  );

  const onProfileColorPickerClose = useCallback(() => {
    setCurrentTab('settings');
  }, [setCurrentTab]);

  const tabs = useMemo(
    () =>
      convertToNonNullArray([
        {
          tabKey: 'settings',
          label: intl.formatMessage({
            defaultMessage: 'Configuration',
            description: 'Configuration tab label in SimpleButton edition',
          }),
        },
        {
          tabKey: 'color',
          label: intl.formatMessage({
            defaultMessage: 'Button color',
            description: 'Button color tab label in SimpleButton edition',
          }),
          rightElement: (
            <ColorPreview
              color={swapColor(buttonColor, webCard?.cardColors)}
              style={{ marginLeft: 5 }}
            />
          ),
        },
      ]),
    [buttonColor, intl, webCard?.cardColors],
  );

  const keyboardType: KeyboardType = useMemo(() => {
    switch (actionType) {
      case 'email':
        return 'email-address';
      case 'link':
        return 'url';
      default:
        return 'number-pad';
    }
  }, [actionType]);

  const SELECTORS: Array<CountryCodeListOption<'email' | 'link'>> = [
    {
      type: 'email',
      title: intl.formatMessage({
        defaultMessage: 'Email address',
        description:
          'The email address option in the country selector for simple button module',
      }),
      icon: 'mail',
    },
    {
      type: 'link',
      title: intl.formatMessage({
        defaultMessage: 'Link URL',
        description:
          'The link URL option in the country selector for simple button module',
      }),
      icon: 'link',
    },
  ];

  const getActionTypePlaceholder = () => {
    return (
      SELECTORS.find(selector => selector.type === actionType)?.title ??
      intl.formatMessage({
        defaultMessage: 'Phone Number',
        description:
          'The Phone Number URL option in the country selector for simple button module',
      })
    );
  };

  const onActionLinkTextInputChangeText = useCallback(
    (text: string) => {
      const phoneNumber = parsePhoneNumberFromString(
        text.trim(),
        actionType as CountryCode,
      );
      if (phoneNumber) {
        onActionLinkChange(phoneNumber.number);
      } else {
        onActionLinkChange(text.trim());
      }
      setPhoneNumber(phoneNumber);
    },
    [actionType, onActionLinkChange],
  );

  const handleActionTypeChange = useCallback(
    (actionType: ActionType) => {
      const parsedNumber = parsePhoneNumberFromString(
        phoneNumber?.nationalNumber || actionLink,
        actionType as CountryCode,
      );
      if (parsedNumber) {
        onActionLinkChange(parsedNumber.number);
      }
      setPhoneNumber(parsedNumber);
      onActionTypeChange(actionType);
    },
    [
      actionLink,
      onActionLinkChange,
      onActionTypeChange,
      phoneNumber?.nationalNumber,
    ],
  );

  const onBlur = useCallback(() => {
    unfocus();
    if (!actionLink) {
      return;
    }
    switch (actionType) {
      case 'email':
        if (!isValidEmail(actionLink)) {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'The email address is not valid.',
              description:
                'Error toast message when a the email address in button editor is not valid.',
            }),
          });
        }
        break;
      case 'link':
        if (!actionLink.startsWith('http')) {
          onActionLinkChange(`https://${actionLink}`);
        }
        break;
      default:
        if (!isPhoneNumber(actionLink, actionType as CountryCode)) {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'The phone number is not valid.',
              description:
                'Error toast message when a the phone number in button editor is not valid.',
            }),
          });
        }
        break;
    }
  }, [actionLink, actionType, intl, onActionLinkChange, unfocus]);

  return (
    <View style={[styles.root, style]} {...props}>
      <View style={styles.paramContainer}>
        <TabsBar
          currentTab={currentTab}
          onTabPress={setCurrentTab}
          tabs={tabs}
        />
        <TextInput
          value={buttonLabel}
          onChangeText={onButtonLabelChange}
          placeholder={intl.formatMessage({
            defaultMessage: 'Button Label',
            description:
              'Label of the buttonLabel input in SimpleButton Settings edition',
          })}
          maxLength={SIMPLE_BUTTON_MAX_LABEL_LENGTH}
        />
        <View style={{ rowGap: 15 }}>
          <View style={styles.actionContainer}>
            <CountryCodeListWithOptions<'email' | 'link'>
              otherSectionTitle={intl.formatMessage({
                defaultMessage: 'Button Options',
                description:
                  'Label of the action type selector in SimpleButton Settings edition',
              })}
              phoneSectionTitle={intl.formatMessage({
                defaultMessage: 'Contact by phone number',
                description:
                  'Signup Form Connect with phone number section title in country selection list SimpleButton Settings edition',
              })}
              value={actionType as ActionType} //force type here, will not define country code is GraphQL
              options={SELECTORS}
              onChange={handleActionTypeChange}
              style={styles.selectorsList}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Select a calling code, email or an URL link',
                description:
                  'Simplebutton - The accessibility label for the CountryCodeListWithOptions selector ',
              })}
              accessibilityHint={intl.formatMessage({
                defaultMessage:
                  'Opens a list of countries, an email address and an URL link and allows you to select if you want to use an email, a link or a phone number for the simple button action',
                description:
                  'Simplebutton - The accessibility hint for the CountryCodeListWithOptions',
              })}
            />
            <TextInputWithEllipsizeMode
              value={
                isFocused && phoneNumber
                  ? phoneNumber?.nationalNumber
                  : actionLink
              }
              onChangeText={onActionLinkTextInputChangeText}
              placeholder={getActionTypePlaceholder()}
              onBlur={onBlur}
              onFocus={focus}
              style={{ flex: 1 }}
              autoCapitalize="none"
              keyboardType={keyboardType}
              enterKeyHint="done"
              prefix={
                isFocused && phoneNumber?.countryCallingCode
                  ? `+${phoneNumber?.countryCallingCode}`
                  : ''
              }
            />
          </View>
          <View style={styles.buttonContainer}>
            <FontDropDownPicker
              fontFamily={fontFamily}
              onFontFamilyChange={onFontFamilyChange}
              bottomSheetHeight={bottomSheetHeight}
            />
            <WebCardColorDropDownPicker
              webCard={webCard ?? null}
              color={fontColor}
              onColorChange={onFontColorChange}
              bottomSheetHeight={bottomSheetHeight}
            />
          </View>
          <LabeledDashedSlider
            label={
              <FormattedMessage
                defaultMessage="Font size :"
                description="fontSize message in SimpleButton edition"
              />
            }
            value={fontSize}
            min={SIMPLE_BUTTON_MIN_FONT_SIZE}
            max={SIMPLE_BUTTON_MAX_FONT_SIZE}
            step={1}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Font size',
              description:
                'Label of the fontSize slider in SimpleButton edition',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Slide to change the Font Size',
              description:
                'Hint of the fontSize slider in SimpleButton edition',
            })}
            style={styles.slider}
            onTouched={onTouched}
          />
          {webCard && (
            <WebCardColorPicker
              visible={currentTab !== 'settings'}
              height={bottomSheetHeight}
              webCard={webCard}
              title={intl.formatMessage({
                defaultMessage: 'Button color',
                description: 'Button color title in SimpleButton edition',
              })}
              selectedColor={buttonColor}
              onColorChange={onButtonColorChange}
              onRequestClose={onProfileColorPickerClose}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default SimpleButtonSettingsEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
  paramContainer: {
    width: '100%',
    rowGap: 25,
    justifyContent: 'center',
  },
  actionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: 15,
    width: '100%',
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
    marginBottom: 15,
  },
  selectorsList: {
    marginRight: 5,
  },
});
