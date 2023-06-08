import { useCallback, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { colors } from '#theme';
import useViewportSize, { insetBottom } from '#hooks/useViewportSize';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ToggleButton from '#ui/ToggleButton';
import ContinueButton from './ContinueButton';
import NewProfileScreenPageHeader from './NewProfileScreenPageHeader';
import type { InterestPicker_interests$key } from '@azzapp/relay/artifacts/InterestPicker_interests.graphql';
import type { InterestPickerMutation } from '@azzapp/relay/artifacts/InterestPickerMutation.graphql';
import type { LayoutChangeEvent, ScrollView } from 'react-native';

type InterestPickerProps = {
  interests: InterestPicker_interests$key;
  onClose: () => void;
  profileKind: string;
};

const InterestPicker = ({
  profileKind,
  interests: interestsKey,
  onClose,
}: InterestPickerProps) => {
  const interests = useFragment(
    graphql`
      fragment InterestPicker_interests on Interest @relay(plural: true) {
        tag
        label
      }
    `,
    interestsKey,
  );

  const [selectedInterests, setSelectedInterests] = useState(new Set<string>());

  const vp = useViewportSize();
  const intl = useIntl();
  const onSelectInterest = useCallback((tag: string) => {
    setSelectedInterests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  }, []);

  const [commit, savingInterest] = useMutation<InterestPickerMutation>(
    graphql`
      mutation InterestPickerMutation($input: UpdateProfileInput!) {
        updateProfile(input: $input) {
          profile {
            id
          }
        }
      }
    `,
  );

  const onSubmit = useCallback(() => {
    commit({
      variables: {
        input: {
          interests: Array.from(selectedInterests.values()),
        },
      },
      onCompleted: () => {
        onClose();
      },
      onError: (e: any) => {
        // TODO
        console.log(e);
      },
    });
  }, [commit, onClose, selectedInterests]);

  const interestsChunked = useMemo(() => {
    const interestsSorted = interests
      .filter(interest => !!interest.label)
      .sort((a, b) => a.label!.localeCompare(b.label!));
    return Array.from({ length: 3 }, (_, i) =>
      interestsSorted.filter((_, j) => j % 3 === i),
    );
  }, [interests]);

  const scrollViewRef = useRef<ScrollView>(null);

  const ready = useRef(new Animated.Value(0)).current;

  const onInterestLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: layout.width / 2 - 20,
          animated: false,
        });
      }
      Animated.timing(ready, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }).start();
    },
    [ready],
  );

  return (
    <View
      style={[
        {
          paddingTop: vp`50`,
          flex: 1,
          justifyContent: 'center',
        },
      ]}
    >
      <NewProfileScreenPageHeader
        activeIndex={2}
        title={
          profileKind === 'personnal' ? (
            <FormattedMessage
              defaultMessage="Tell us more about you"
              description="NewProfileType Interest Picker Screen - Title for personal profile"
            />
          ) : (
            <FormattedMessage
              defaultMessage="Tell us more about your company"
              description="NewProfileType Interest Picker Screen - Title"
            />
          )
        }
      />

      <Text variant="medium" style={styles.subtitleText}>
        <FormattedMessage
          defaultMessage="Pick some topics you like."
          description="NewProfile About User Screen - SubTitle Pick some topics you like."
        />
      </Text>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        style={{ flex: 1, minHeight: 149, opacity: ready }}
        contentContainerStyle={{
          justifyContent: 'center',
          flexDirection: 'column',
        }}
        contentOffset={{ x: 20, y: 0 }}
        showsHorizontalScrollIndicator={false}
        pointerEvents={savingInterest ? 'none' : 'auto'}
      >
        {interestsChunked.map((interests, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              paddingBottom: i < interestsChunked.length - 1 ? 22 : 0,
            }}
            onLayout={i === 0 ? onInterestLayout : undefined}
          >
            {interests.map(item => (
              <ToggleButton
                key={item.tag}
                label={item.label}
                toggled={selectedInterests.has(item.tag)}
                onPress={() => onSelectInterest(item.tag)}
                style={{ marginTop: 0, marginBottom: 0, marginRight: 10 }}
              />
            ))}
          </View>
        ))}
      </Animated.ScrollView>

      <ContinueButton
        testID="get-started-button"
        label={intl.formatMessage({
          defaultMessage: 'Get started',
          description: 'Interests pickers - Get started Button',
        })}
        onPress={onSubmit}
        loading={savingInterest}
        disabled={selectedInterests.size === 0}
      />
      <View
        style={{
          marginBottom: vp`${insetBottom} `,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <PressableNative
          testID="skip-button"
          accessibilityRole="button"
          onPress={onClose}
          disabled={savingInterest}
        >
          <Text variant="medium" style={styles.skip}>
            <FormattedMessage
              defaultMessage="Skip"
              description="NewProfile About Screen - Skip process"
            />
          </Text>
        </PressableNative>
      </View>
    </View>
  );
};

export default InterestPicker;

const styles = StyleSheet.create({
  subtitleText: {
    fontSize: 14,
    marginLeft: 33,
    marginRight: 33,
    textAlign: 'center',
    paddingBottom: 25,
    paddingTop: 20,
    color: colors.grey400,
  },
  skip: {
    color: colors.grey200,
  },
});
