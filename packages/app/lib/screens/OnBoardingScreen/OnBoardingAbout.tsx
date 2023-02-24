import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import useViewportSize, {
  insetBottom,
  insetTop,
} from '../../hooks/useViewportSize';
import { colors, fontFamilies } from '../../theme';
import Button from '../../ui/Button';
import Form, { Submit } from '../../ui/Form/Form';
import IconButton from '../../ui/IconButton';
import PressableNative from '../../ui/PressableNative';
import TagCategory from '../../ui/TagCategory';

import OnBoardingPager from './OnBoardingPager';
import type { TagCatoryItem } from '../../ui/TagCategory';

//TODO : get a list of interest from the server
const FAKE_INTEREST1: TagCatoryItem[] = [...Array(10).keys()].map(item => {
  return { id: `${item}`, label: `Interest ${item}` };
});

const FAKE_INTEREST2: TagCatoryItem[] = [...Array(10).keys()].map(item => {
  return { id: `${item + 10}`, label: `Interest ${item + 10}` };
});

const FAKE_INTEREST3: TagCatoryItem[] = [...Array(10).keys()].map(item => {
  return { id: `${item + 20}`, label: `Interest ${item + 20}` };
});

type OnBoardingAboutProps = {
  next: () => void;
  prev: () => void;
  skip: () => void;
  profileKind: 'business' | 'personal' | 'product';
};

const OnBoardingAboutUser = ({
  next,
  prev,
  skip,
  profileKind,
}: OnBoardingAboutProps) => {
  const vp = useViewportSize();
  const intl = useIntl();
  const onSubmit = useCallback(async () => {
    next();
  }, [next]);

  const [selectedInterest, setSelectedInterest] = useState<Set<string>>(
    new Set<string>(),
  );

  const onPressCategory = useCallback(
    (item: TagCatoryItem) => {
      if (selectedInterest.has(item.id)) {
        setSelectedInterest(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
        return;
      } else {
        setSelectedInterest(prev => {
          const newSet = new Set(prev);
          newSet.add(item.id);
          return newSet;
        });
      }
    },
    [selectedInterest],
  );

  return (
    <Form
      style={[
        {
          paddingTop: vp`${insetTop} + ${90}`,
          marginBottom: vp`${insetBottom} + ${10}`,
          flex: 1,
          justifyContent: 'center',
        },
      ]}
      onSubmit={onSubmit}
    >
      <View style={styles.containerIcon}>
        <IconButton icon="back" onPress={prev} style={styles.backIcon} />
        <Text style={styles.titleText}>
          {profileKind === 'personal' ? (
            <FormattedMessage
              defaultMessage="Tell us more about you?"
              description="OnBoarding About Screen - Title Tell us more about you"
            />
          ) : (
            <FormattedMessage
              defaultMessage="Tell us more about your company?"
              description="OnBoarding About Screen - Title Tell us more about your company"
            />
          )}
        </Text>
      </View>
      <OnBoardingPager activeIndex={2} />

      <Text style={styles.subtitleText}>
        {profileKind === 'business' ? (
          <FormattedMessage
            defaultMessage="Pick some topics you like."
            description="OnBoarding About User Screen - SubTitle Pick some topics you like."
          />
        ) : (
          <FormattedMessage
            defaultMessage="Pick some topics that describes your company."
            description="OnBoarding About Screen - SubTitle Pick some topics that describes your company."
          />
        )}
      </Text>
      <ScrollView
        horizontal
        style={{ flex: 1, minHeight: 149 }}
        contentContainerStyle={{
          justifyContent: 'center',
          flexDirection: 'column',
        }}
        contentOffset={{ x: 20, y: 0 }}
      >
        <View style={{ flexDirection: 'row' }}>
          {FAKE_INTEREST1.map(item => (
            <TagCategory
              key={item.id}
              item={item}
              selected={selectedInterest.has(item.id)}
              onPress={onPressCategory}
              style={{ marginTop: 0, marginBottom: 0, marginRight: 10 }}
            />
          ))}
        </View>
        <View
          style={{
            flexDirection: 'row',
            paddingTop: 22,
            paddingBottom: 22,
          }}
        >
          {FAKE_INTEREST2.map(item => (
            <TagCategory
              key={item.id}
              item={item}
              selected={selectedInterest.has(item.id)}
              onPress={onPressCategory}
              style={{ marginTop: 0, marginBottom: 0, marginRight: 10 }}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {FAKE_INTEREST3.map(item => (
            <TagCategory
              key={item.id}
              item={item}
              selected={selectedInterest.has(item.id)}
              onPress={onPressCategory}
              style={{ marginTop: 0, marginBottom: 0, marginRight: 10 }}
            />
          ))}
        </View>
      </ScrollView>

      <Submit>
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Get started',
            description: 'OnBoarding About Screen - Get started Button',
          })}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Get started',
            description:
              'OnBoarding About Screen - AccessibilityLabel Get started',
          })}
          style={styles.button}
        />
      </Submit>
      <View
        style={{
          marginBottom: vp`${insetBottom} `,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <PressableNative onPress={skip}>
          <Text style={styles.back}>
            <FormattedMessage
              defaultMessage="Skip"
              description="OnBoarding About Screen - Skip process"
            />
          </Text>
        </PressableNative>
      </View>
    </Form>
  );
};

export default OnBoardingAboutUser;

const styles = StyleSheet.create({
  containerIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    marginRight: 70,
    marginLeft: 20,
  },
  backIcon: { height: 17, width: 10 },
  titleText: {
    ...fontFamilies.semiBold,
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
    paddingTop: 0,
    color: colors.black,
    textAlignVertical: 'center',
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
  mainContent: { flex: 1, justifyContent: 'flex-start' },

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
    marginLeft: 20,
    marginRight: 20,
  },
  back: { color: colors.grey200 },
});
