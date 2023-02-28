import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, Text } from 'react-native';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors, fontFamilies } from '#theme';
import useViewportSize, { insetBottom, insetTop } from '#hooks/useViewportSize';
import Button from '#ui/Button';
import Form, { Submit } from '#ui/Form/Form';
import TagCategory from '#ui/TagCategory';

import OnBoardingPager from './OnBoardingPager';
import type { TagCatoryItem } from '#ui/TagCategory';

type OnBoardingTypeProps = {
  next: () => void;
  profileKind?: 'business' | 'personal' | 'product';
  setProfileKind: (profileKind: 'business' | 'personal' | 'product') => void;
};

const OnBoardingType = ({
  next,
  setProfileKind,
  profileKind,
}: OnBoardingTypeProps) => {
  const vp = useViewportSize();
  const intl = useIntl();
  const onSubmit = useCallback(async () => {
    next();
  }, [next]);

  const setProfileKindFromgTag = (profileKind: TagCatoryItem) => {
    setProfileKind(profileKind.id as 'business' | 'personal' | 'product');
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
            id: 'personal',
            label: intl.formatMessage({
              defaultMessage: 'Person',
              description: 'UserType: personal',
            }),
          }}
          onPress={setProfileKindFromgTag}
          selected={profileKind === 'personal'}
        />
        <TagCategory
          item={{
            id: 'business',
            label: intl.formatMessage({
              defaultMessage: 'Business/company',
              description: 'UserType: business/company',
            }),
          }}
          onPress={setProfileKindFromgTag}
          selected={profileKind === 'business'}
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
          disabled={!isNotFalsyString(profileKind)}
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
