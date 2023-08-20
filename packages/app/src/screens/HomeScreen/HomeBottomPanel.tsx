import { useState, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { colors } from '#theme';
import TabView from '#ui/TabView';
import Text from '#ui/Text';
import HomeContactCard from './HomeContactCard';
import HomeInformations from './HomeInformations';
import HomeMenu from './HomeMenu';
import HomeStatistics from './HomeStatistics';
import type { HOME_TAB } from './HomeMenu';
import type { HomeContactCard_user$key } from '@azzapp/relay/artifacts/HomeContactCard_user.graphql';
import type { HomeInformations_user$key } from '@azzapp/relay/artifacts/HomeInformations_user.graphql';
import type { HomeStatistics_user$key } from '@azzapp/relay/artifacts/HomeStatistics_user.graphql';
import type { SharedValue } from 'react-native-reanimated';

type HomeBottomPanelProps = {
  /**
   * the height unit determined at main screen to have a adaptable layout based on screen size
   *
   * @type {number}
   */
  containerHeight: number;
  user: HomeContactCard_user$key &
    HomeInformations_user$key &
    HomeStatistics_user$key;
  /**
   * current position of the scrolling profile (based on profile index and not scrollValue )
   *
   * @type {SharedValue<number>}
   */
  currentProfileIndexSharedValue: SharedValue<number>;

  currentUserIndex: number;
};

const HomeBottomPanel = ({
  containerHeight,
  user,
  currentProfileIndexSharedValue,
  currentUserIndex,
}: HomeBottomPanelProps) => {
  const [selectedPanel, setSelectedPanel] = useState<HOME_TAB>('CONTACT_CARD');

  const animatedBottomStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      currentProfileIndexSharedValue.value,
      [-1, 0],
      [0, 1],
    );
    return { overflow: 'visible', opacity, flex: 1 };
  }, [currentProfileIndexSharedValue]);

  const animatedNewCardStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      currentProfileIndexSharedValue.value,
      [-1, 0],
      [1, 0],
    );
    return {
      overflow: 'visible',
      opacity,
      width: '100%',
      height: '100%',
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    };
  }, [currentProfileIndexSharedValue]);

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={animatedNewCardStyle}>
        <Text variant="large" style={{ color: colors.white }}>
          <FormattedMessage
            defaultMessage="Create a new Webcard"
            description="Home Screen - Create a new WebCard"
          />
        </Text>
        <Text
          variant="medium"
          style={{ color: colors.white, marginHorizontal: 50, marginTop: 10 }}
        >
          <FormattedMessage
            defaultMessage="Lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit amet"
            description="Home Screen - Create a new webcard description"
          />
        </Text>
      </Animated.View>

      <Animated.View style={animatedBottomStyle}>
        <HomeMenu selected={selectedPanel} setSelected={setSelectedPanel} />

        <TabView
          style={{ flex: 1 }}
          tabs={[
            {
              id: 'CONTACT_CARD',
              element: (
                <HomeContactCard
                  user={user}
                  height={2 * containerHeight}
                  animated={selectedPanel === 'CONTACT_CARD'}
                  currentProfileIndexSharedValue={
                    currentProfileIndexSharedValue
                  }
                />
              ),
            },
            {
              id: 'STATS',
              element: (
                <HomeStatistics
                  user={user}
                  height={2 * containerHeight}
                  animated={selectedPanel === 'STATS'}
                  currentProfileIndexSharedValue={
                    currentProfileIndexSharedValue
                  }
                  currentUserIndex={currentUserIndex}
                />
              ),
            },
            {
              id: 'INFORMATION',
              element: (
                <HomeInformations
                  user={user}
                  animated={selectedPanel === 'INFORMATION'}
                  currentProfileIndexSharedValue={
                    currentProfileIndexSharedValue
                  }
                />
              ),
            },
          ]}
          currentTab={selectedPanel}
        />
      </Animated.View>
    </View>
  );
};

export default memo(HomeBottomPanel);
