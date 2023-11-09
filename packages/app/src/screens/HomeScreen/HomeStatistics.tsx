import _ from 'lodash';
import { memo, useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  useAnimatedStyle,
  useAnimatedReaction,
  useAnimatedRef,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { colors, fontFamilies } from '#theme';
import AnimatedText from '#components/AnimatedText';
import Text from '#ui/Text';
import HomeStatisticsChart from './HomeStatisticsChart';
import type { HomeStatistics_user$key } from '@azzapp/relay/artifacts/HomeStatistics_user.graphql';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type HomeInformationsProps = {
  user: HomeStatistics_user$key;
  height: number;
  animated: boolean;
  currentProfileIndexSharedValue: SharedValue<number>;
  currentUserIndex: number;
};

const HomeStatistics = ({
  user,
  height,
  animated,
  currentUserIndex,
  currentProfileIndexSharedValue,
}: HomeInformationsProps) => {
  //TODO: backend part .
  const data = useFragment(
    graphql`
      fragment HomeStatistics_user on User {
        profiles {
          id
          nbLikes
          nbWebcardViews
          nbContactCardScans
        }
        ...HomeStatisticsChart_user
      }
    `,
    user,
  );

  const { width } = useWindowDimensions();
  const intl = useIntl();

  const scrollIndexOffset = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollIndexOffset.value = event.contentOffset.x / BOX_NUMBER_WIDTH;
  });

  const totalLikes = useSharedValue(format(0));
  const totalScans = useSharedValue(format(0));
  const totalViews = useSharedValue(format(0));

  const inputRange = _.range(0, data.profiles?.length);
  const { profiles } = data;
  const likes = useMemo(
    () => profiles?.map(profile => profile.nbLikes) ?? [],
    [profiles],
  );
  const contactcardScans = useMemo(
    () => profiles?.map(profile => profile.nbContactCardScans) ?? [],
    [profiles],
  );
  const webcardViews = useMemo(
    () => profiles?.map(profile => profile.nbWebcardViews) ?? [],
    [profiles],
  );

  useAnimatedReaction(
    () => currentProfileIndexSharedValue.value,
    actual => {
      if (profiles && profiles?.length > 1 && actual >= 0 && animated) {
        totalLikes.value = format(
          interpolate(currentProfileIndexSharedValue.value, inputRange, likes),
        );
        totalScans.value = format(
          interpolate(
            currentProfileIndexSharedValue.value,
            inputRange,
            contactcardScans,
          ),
        );
        totalViews.value = format(
          interpolate(
            currentProfileIndexSharedValue.value,
            inputRange,
            webcardViews,
          ),
        );
      } else if (actual >= 0 && !animated && Math.trunc(actual) === actual) {
        //use to hide animation if not show. few perf gain
        const prevIndex = Math.floor(actual);
        totalLikes.value = format(likes[prevIndex] ?? 0);
        totalScans.value = format(contactcardScans[prevIndex] ?? 0);
        totalViews.value = format(webcardViews[prevIndex] ?? 0);
      }
    },

    [currentProfileIndexSharedValue.value, animated, profiles, inputRange],
  );

  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  const onSelectStat = (index: number) => {
    scrollViewRef?.current?.scrollTo({ x: index * BOX_NUMBER_WIDTH, y: 0 });
  };

  //TODO: if performance issue, inquiry a more complex way to do the chart(skia, D3 etc). it is the simpler using only animated view.
  return (
    <View style={styles.container}>
      <HomeStatisticsChart
        width={width - 2 * PADDING_HORIZONTAL}
        height={height - BOX_NUMBER_HEIGHT}
        statsScrollIndex={scrollIndexOffset}
        animated={animated}
        currentUserIndex={currentUserIndex}
        currentProfileIndexSharedValue={currentProfileIndexSharedValue}
        user={data}
      />
      <AnimatedScrollView
        ref={scrollViewRef}
        style={{
          height: BOX_NUMBER_HEIGHT,
          width: '100%',
          overflow: 'visible',
        }}
        pagingEnabled
        snapToInterval={BOX_NUMBER_WIDTH}
        decelerationRate="fast"
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: (width - 2 * PADDING_HORIZONTAL - BOX_NUMBER_WIDTH) / 2,
          paddingRight: (width - 2 * PADDING_HORIZONTAL - BOX_NUMBER_WIDTH) / 2,
          overflow: 'visible',
        }}
        bounces={false}
        scrollEventThrottle={16}
        horizontal
        onScroll={scrollHandler}
      >
        <StatisticItems
          value={totalViews}
          title={
            intl.formatMessage(
              {
                defaultMessage: 'Webcard{azzappAp} Views',
                description: 'Home statistics - webcardView label',
              },
              {
                azzappAp: (
                  <Text style={styles.icon} variant="azzapp">
                    a
                  </Text>
                ),
              },
            ) as string
          }
          scrollIndex={scrollIndexOffset}
          index={0}
          onSelect={onSelectStat}
        />
        <StatisticItems
          value={totalScans}
          title={intl.formatMessage({
            defaultMessage: 'Contact card scans',
            description: 'Home statistics - Contact card scans label',
          })}
          scrollIndex={scrollIndexOffset}
          index={1}
          onSelect={onSelectStat}
        />
        <StatisticItems
          value={totalLikes}
          title={intl.formatMessage({
            defaultMessage: 'Total Likes',
            description: 'Home statistics - Total Likes',
          })}
          scrollIndex={scrollIndexOffset}
          index={2}
          onSelect={onSelectStat}
        />
      </AnimatedScrollView>
    </View>
  );
};

const BOX_NUMBER_HEIGHT = 50;
const PADDING_HORIZONTAL = 20;
const BOX_NUMBER_WIDTH = 140;

export default memo(HomeStatistics);

type StatisticItemsProps = {
  value: SharedValue<string>;
  scrollIndex: SharedValue<number>;
  title: string;
  index: number;
  onSelect: (index: number) => void;
};
const StatisticItems = ({
  value,
  scrollIndex,
  title,
  index,
  onSelect,
}: StatisticItemsProps) => {
  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(
            scrollIndex.value,
            [index - 1, index, index + 1],
            [0.35, 1, 0.35],
          ),
        },
        {
          translateY: interpolate(
            scrollIndex.value,
            [index - 1, index, index + 1],
            [36, 0, 36],
          ),
        },
      ],
    };
  }, [scrollIndex]);

  const animatedOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollIndex.value,
        [index - 1, index, index + 1],
        [0.3, 1, 0.3],
      ),
    };
  }, [scrollIndex]);

  const onPress = () => {
    onSelect(index);
  };

  return (
    <Animated.View style={[styles.boxContainer, animatedOpacity]}>
      <Pressable onPress={onPress}>
        <AnimatedText
          style={[styles.largetText, animatedTextStyle]}
          text={value}
        />
        <Text variant="smallbold" style={styles.smallText}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  boxContainer: {
    width: BOX_NUMBER_WIDTH,
    height: BOX_NUMBER_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'visible',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: PADDING_HORIZONTAL,
    width: '100%',
    overflow: 'visible',
    flex: 1,
  },
  largetText: {
    ...fontFamilies.extrabold,
    color: colors.white,
    textAlign: 'center',
    fontSize: 44,
  },
  smallText: {
    color: colors.white,
    textAlign: 'center',
  },
  icon: {
    color: colors.white,
  },
});

const format = (value: number) => {
  'worklet';
  return Math.trunc(value).toString();
};
