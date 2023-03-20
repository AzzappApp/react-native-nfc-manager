import { useCallback, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, Text } from 'react-native';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors, fontFamilies } from '#theme';
import useViewportSize, { insetBottom, insetTop } from '#hooks/useViewportSize';
import Button from '#ui/Button';
import DropDownList from '#ui/DropDownList';
import Form, { Submit } from '#ui/Form/Form';
import IconButton from '#ui/IconButton';

import TextInput from '#ui/TextInput';
import OnBoardingPager from './OnBoardingPager';
import type { DropDownListData, DropDownListHandle } from '#ui/DropDownList';

type OnBoardingNameCompanyProps = {
  next: () => void;
  prev: () => void;
  setCompanyName: (companyName: string) => void;
  setCompanyActivityId: (companyActivityId: string) => void;
  companyName?: string;
  companyActivityId?: string;
};

const OnBoardingNameCompany = ({
  next,
  prev,
  setCompanyName,
  setCompanyActivityId,
  companyName,
  companyActivityId,
}: OnBoardingNameCompanyProps) => {
  const vp = useViewportSize();
  const intl = useIntl();
  const dropDownRef = useRef<DropDownListHandle>(null);
  const setCompanyActivityIdFromList = useCallback(
    (item: DropDownListData) => {
      setCompanyActivityId(item.id);
    },
    [setCompanyActivityId],
  );

  return (
    <Form
      style={[
        styles.inner,
        {
          paddingTop: vp`${insetTop} + ${90}`,
          marginBottom: vp`${insetBottom} + ${10}`,
          flex: 1,
          justifyContent: 'flex-end',
        },
      ]}
      onSubmit={next}
    >
      <View style={styles.containerIcon}>
        <IconButton icon="back" onPress={prev} style={styles.backIcon} />
        <Text style={styles.titleText}>
          <FormattedMessage
            defaultMessage="Tell us more about your company"
            description="OnBoarding Name Company Screen - Title"
          />
        </Text>
      </View>

      <OnBoardingPager activeIndex={1} />
      <Text style={styles.subtitleText}>
        <FormattedMessage
          defaultMessage="Pick some topics about your company"
          description="OnBoarding Name Company Screen - Subtitle Pick some topics about your company"
        />
      </Text>
      <TextInput
        placeholder={intl.formatMessage({
          defaultMessage: 'Enter your company name',
          description:
            'OnBoarding Name Company Screen - Enter your company name placeholder',
        })}
        value={companyName}
        onChangeText={setCompanyName}
        autoCapitalize="none"
        autoComplete="name"
        autoCorrect={false}
        onFocus={() => {
          dropDownRef.current?.closeDropDown();
        }}
        containerStyle={styles.textinputContainer}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Enter your company name',
          description:
            'OnBoarding Name Company Screen - Accessibility TextInput Enter your company name',
        })}
        label={intl.formatMessage({
          defaultMessage: 'Company name',
          description:
            'OnBoarding Name Company Screen - Company name label textinput',
        })}
      />
      <DropDownList
        ref={dropDownRef}
        selectedId={companyActivityId}
        setSelected={setCompanyActivityIdFromList}
        data={[
          { id: '1', label: 'Label 1' },
          { id: '2', label: 'Label 2' },
          { id: '3', label: 'Label 3' },
          { id: '4', label: 'Label 4' },
          { id: '5', label: 'Label 5' },
        ]}
        maxHeight={150}
        containerStyle={{ marginLeft: 0, marginRight: 0 }}
        label={intl.formatMessage({
          defaultMessage: 'Activity',
          description:
            'OnBoarding Name Company Screen - Label Activity textinput',
        })}
        textInputProps={{
          placeholder: intl.formatMessage({
            defaultMessage: 'Choose a company activity',
            description:
              'OnBoarding Name Company Screen - Accessibility TextInput Placeholder Choose a company activity',
          }),
        }}
      />
      <View style={styles.flex} />
      <Submit>
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Continue',
            description: 'OnboardingScreen - Continue Button',
          })}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Continue',
            description:
              'OnBoarding Name Company Screen - AccessibilityLabel Continue',
          })}
          style={styles.button}
          disabled={
            !isNotFalsyString(companyName) ||
            !isNotFalsyString(companyActivityId)
          }
        />
      </Submit>
    </Form>
  );
};

export default OnBoardingNameCompany;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  containerIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    marginRight: 50,
  },
  backIcon: { height: 17, width: 10 },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleText: {
    ...fontFamilies.fontMedium,
    fontSize: 14,
    marginLeft: 33,
    marginRight: 33,
    textAlign: 'center',
    paddingBottom: 25,
    paddingTop: 20,
    color: colors.grey400,
  },
  titleText: {
    ...fontFamilies.semiBold,
    fontSize: 20,
    marginLeft: 33,
    marginRight: 33,
    textAlign: 'center',
    paddingBottom: 20,
    paddingTop: 0,
    color: colors.black,
  },
  mainContent: { flex: 1, justifyContent: 'flex-start' },
  inner: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  textinputContainer: {
    padding: 0,
    margin: 0,
    marginBottom: 0,
  },
  button: {
    height: 45,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});
