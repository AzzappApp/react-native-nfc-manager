import { FormattedMessage } from 'react-intl';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import PressableBackground from '#ui/PressableBackground';
import Text from '#ui/Text';
import RecommendedProfilesList from './RecommendedProfilesList';
import TrendingPostsList from './TrendingPostsList';
import TrendingProfilesList from './TrendingProfilesList';
import type { SearchScreen_viewer$data } from '@azzapp/relay/artifacts/SearchScreen_viewer.graphql';

type WallRecommendationProps = {
  viewer: SearchScreen_viewer$data;
  hasFocus: boolean;
};
const WallRecommendation = ({ viewer, hasFocus }: WallRecommendationProps) => {
  return (
    <TrendingPostsList
      viewer={viewer}
      ListHeaderComponent={
        <>
          <Text variant="button" style={styles.titleSection}>
            <FormattedMessage
              defaultMessage="Trending profiles"
              description="SearchPage - Trending profile title"
            />
          </Text>
          <View>
            <TrendingProfilesList viewer={viewer} />
            <SeeAll />
          </View>
          <Text variant="button" style={styles.titleSection}>
            <FormattedMessage
              defaultMessage="Profiles you may like"
              description="SearchPage - Profile recommendation title"
            />
          </Text>
          <View>
            <RecommendedProfilesList viewer={viewer} />
            <SeeAll />
          </View>
          <Text variant="button" style={styles.titleSection}>
            <FormattedMessage
              defaultMessage="Trending posts"
              description="SearchPage - Trending posts title"
            />
          </Text>
        </>
      }
      canPlay={hasFocus}
    />
  );
};

export default WallRecommendation;

const IMAGE_SIZE = PixelRatio.roundToNearestPixel(24);

const SeeAll = () => {
  return (
    <View style={styles.viewSeeAll} pointerEvents="box-none">
      <PressableBackground
        style={styles.pressableSeeAll}
        // eslint-disable-next-line no-alert
        onPress={() => alert('todo')}
      >
        <Text variant="button" style={styles.seeAllFont}>
          <FormattedMessage
            defaultMessage="See all"
            description="CoverList - See all button"
          />
        </Text>
      </PressableBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  titleSection: {
    marginTop: 17,
    marginBottom: 7,
    marginLeft: 10,
  },
  viewSeeAll: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    top: 0,
    right: 8,
  },
  pressableSeeAll: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    paddingLeft: 5,
    paddingRight: 5,
    borderRadius: 14,
    borderColor: colors.grey50,
    borderWidth: 1,
    backgroundColor: 'white',
  },
  seeAllFont: {
    fontSize: 12,
    color: colors.black,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    tintColor: colors.grey50,
  },
  imageActive: {
    tintColor: colors.black,
  },
});
