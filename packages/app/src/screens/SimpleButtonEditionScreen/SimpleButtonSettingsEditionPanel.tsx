import { useState, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';

import { useFragment, graphql } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  SIMPLE_BUTTON_MAX_FONT_SIZE,
  SIMPLE_BUTTON_MAX_LABEL_LENGTH,
  SIMPLE_BUTTON_MIN_FONT_SIZE,
} from '@azzapp/shared/cardModuleHelpers';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import ProfileColorPicker, {
  ProfileColorDropDownPicker,
} from '#components/ProfileColorPicker';
import ColorPreview from '#ui/ColorPreview';
import CountryCodeListWithOptions from '#ui/CountryCodeListWithOptions';
import FontDropDownPicker from '#ui/FontDropDownPicker';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TabsBar from '#ui/TabsBar';
import TextInput from '#ui/TextInput';
import type { CountryCodeListOption } from '#ui/CountryCodeListWithOptions';
import type { SimpleButtonSettingsEditionPanel_viewer$key } from '@azzapp/relay/artifacts/SimpleButtonSettingsEditionPanel_viewer.graphql';
import type { CountryCode } from 'libphonenumber-js';
import type { ViewProps } from 'react-native';

type SimpleButtonSettingsEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the viewer
   */
  viewer: SimpleButtonSettingsEditionPanel_viewer$key;
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
  fontSize: number;
  /**
   * A callback called when the user update the fontSize
   */
  onFontSizeChange: (fontSize: number) => void;
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
};

/**
 * A Panel to edit the Settings of the SimpleButton edition screen
 */
const SimpleButtonSettingsEditionPanel = ({
  viewer,
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
  onFontSizeChange,
  buttonColor,
  onButtonColorChange,
  style,
  bottomSheetHeight,
  ...props
}: SimpleButtonSettingsEditionPanelProps) => {
  const intl = useIntl();

  const [currentTab, setCurrentTab] = useState<string>('settings');
  const { profile } = useFragment(
    graphql`
      fragment SimpleButtonSettingsEditionPanel_viewer on Viewer {
        profile {
          ...ProfileColorPicker_profile
          cardColors {
            primary
            dark
            light
          }
        }
      }
    `,
    viewer,
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
              color={swapColor(buttonColor, profile?.cardColors)}
              style={{ marginLeft: 5 }}
            />
          ),
        },
      ]),
    [buttonColor, intl, profile?.cardColors],
  );

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

  const onFocus = () => {
    if (actionType === 'link' && !isNotFalsyString(actionLink)) {
      onActionLinkChange('https://');
    }
  };

  const onBlur = () => {
    if (actionType === 'link' && !actionLink.startsWith('http')) {
      onActionLinkChange(`https://${actionLink}`);
    }
  };

  return (
    <View style={[styles.root, style]} {...props}>
      <TabsBar currentTab={currentTab} onTabPress={setCurrentTab} tabs={tabs} />
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
            value={actionType as CountryCode | 'email' | 'link'} //force type here, will not define country code is GraphQL
            options={SELECTORS}
            onChange={onActionTypeChange}
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
          <TextInput
            value={actionLink}
            onChangeText={onActionLinkChange}
            placeholder={getActionTypePlaceholder()}
            style={{ flex: 1 }}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </View>
        <View style={styles.buttonContainer}>
          <FontDropDownPicker
            fontFamily={fontFamily}
            onFontFamilyChange={onFontFamilyChange}
            bottomSheetHeight={bottomSheetHeight}
          />
          <ProfileColorDropDownPicker
            profile={profile!}
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
          onChange={onFontSizeChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Font size',
            description: 'Label of the fontSize slider in SimpleButton edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Font Size',
            description: 'Hint of the fontSize slider in SimpleButton edition',
          })}
          style={styles.slider}
        />
        {profile && (
          <ProfileColorPicker
            visible={currentTab !== 'settings'}
            height={bottomSheetHeight}
            profile={profile}
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
  );
};

export default SimpleButtonSettingsEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    rowGap: 15,
    justifyContent: 'flex-start',
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
