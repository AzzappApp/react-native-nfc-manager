import { range } from 'lodash';
import { useCallback } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import Skeleton from '#components/Skeleton';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Container from '#ui/Container';
import HomeHeader from './HomeHeader';
import type { ViewProps } from 'react-native';

const HomeScreenFallback = ({ style, ...props }: ViewProps) => {
  const noop = useCallback(() => {
    // Do nothing
  }, []);

  const fakePosts = [
    [0.8, 1.5, 0.7, 1.4],
    [1.2, 0.9, 1.3, 0.6],
  ];

  const styles = useStyleSheet(styleSheet);
  const insets = useSafeAreaInsets();

  const renderFakePosts = useCallback(
    (ratio: number, key: number) => (
      <Skeleton key={key} style={[{ aspectRatio: ratio }, styles.post]} />
    ),
    [styles.post],
  );

  return (
    <Container {...props} style={[{ paddingTop: insets.top }, style]}>
      <HomeHeader goToSettings={noop} />
      <View style={styles.skeletonCoverContainer}>
        {range(0, 3).map(i => (
          <Skeleton key={i} style={styles.skeletonCover} />
        ))}
      </View>
      <Container style={styles.postsContainer}>
        {fakePosts.map((columnPosts, i) => (
          <View key={i} style={styles.postColumn}>
            {columnPosts.map((ratio, j) => renderFakePosts(ratio, j))}
          </View>
        ))}
      </Container>
    </Container>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  root: {
    flex: 1,
  },
  skeletonCoverContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 13,
    marginLeft: 10,
  },
  skeletonCover: {
    width: COVER_BASE_WIDTH,
    borderRadius: COVER_CARD_RADIUS * COVER_BASE_WIDTH,
    aspectRatio: COVER_RATIO,
  },
  postsContainer: [
    {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 10,
      gap: 10,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      zIndex: 20,
      backgroundColor: appearance === 'dark' ? colors.black : colors.white,
    },
    shadow(appearance),
  ],
  postColumn: {
    flex: 1,
    gap: 10,
  },
  post: {
    borderRadius: 16,
  },
}));

export default HomeScreenFallback;
