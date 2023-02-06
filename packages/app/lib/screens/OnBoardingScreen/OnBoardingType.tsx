import { isNotFalsyString } from '@azzapp/shared/lib/stringHelpers';

import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, Text } from 'react-native';
import { colors, fontFamilies } from '../../../theme';
import useViewportSize, {
  insetBottom,
  insetTop,
} from '../../hooks/useViewportSize';
import Button from '../../ui/Button';
import Form, { Submit } from '../../ui/Form/Form';
import TagCategory from '../../ui/TagCategory';

import OnBoardingPager from './OnBoardingPager';
import type { TagCatoryItem } from '../../ui/TagCategory';
import type { UserType } from '@prisma/client';

type OnBoardingTypeProps = {
  next: () => void;
  userType?: UserType;
  setUserType: (userType: UserType) => void;
};

const OnBoardingType = ({
  next,
  setUserType,
  userType,
}: OnBoardingTypeProps) => {
  const vp = useViewportSize();
  const intl = useIntl();
  const onSubmit = useCallback(async () => {
    next();
  }, [next]);

  const setUserTypeFromgTag = (userType: TagCatoryItem) => {
    setUserType(userType.id as UserType);
  };

  return (
    <Form
      style={[
        styles.inner,
        {
          paddingTop: vp`${insetTop} + ${90}`,
          marginBottom: vp`${insetBottom} + ${10}`,
          flex: 1,
          justifyContent: 'center',
        },
      ]}
      onSubmit={onSubmit}
    >
      <Text style={styles.titleText}>
        <FormattedMessage
          defaultMessage="What best describe you?"
          description="OnBoardingType User Type Screen - Title"
        />
      </Text>
      <OnBoardingPager activeIndex={0} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <TagCategory
          item={{
            id: 'PERSONAL',
            label: intl.formatMessage({
              defaultMessage: 'Person',
              description: 'UserType: PERSONAL',
            }),
          }}
          onPress={setUserTypeFromgTag}
          selected={userType === 'PERSONAL'}
        />
        <TagCategory
          item={{
            id: 'BUSINESS',
            label: intl.formatMessage({
              defaultMessage: 'Business/company',
              description: 'UserType: BUSINESS/company',
            }),
          }}
          onPress={setUserTypeFromgTag}
          selected={userType === 'BUSINESS'}
        />
      </View>
      <Submit>
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Continue',
            description: 'OnBoardingType User Type Screen - Continue Button',
          })}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Tap to sign in',
            description:
              'OnBoardingType User Type Screen - AccessibilityLabel Continue Button',
          })}
          style={styles.button}
          disabled={!isNotFalsyString(userType)}
        />
      </Submit>
    </Form>
  );
};

export default OnBoardingType;

const styles = StyleSheet.create({
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
    marginBottom: 21,
  },
  back: { color: colors.grey200, marginTop: 23 },
});
