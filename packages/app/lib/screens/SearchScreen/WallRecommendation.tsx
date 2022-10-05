import { FormattedMessage } from 'react-intl';
import { PixelRatio, Pressable, StyleSheet, View, Text } from 'react-native';
import { colors, fontFamilies, textStyles } from '../../../theme';
import { useCurrentRoute } from '../../PlatformEnvironment';
import RecommendedProfilesList from './RecommendedProfilesList';
import TrendingPostsList from './TrendingPostsList';
import TrendingProfilesList from './TrendingProfilesList';
import type { SearchScreen_viewer$data } from '@azzapp/relay/artifacts/SearchScreen_viewer.graphql';

type Props = {
  viewer: SearchScreen_viewer$data;
};
const WallRecommendation = ({ viewer }: Props) => {
  const currentRoute = useCurrentRoute('willChange');
  return (
    <TrendingPostsList
      viewer={viewer}
      ListHeaderComponent={
        <>
          <Text style={styles.titleSection}>
            <FormattedMessage
              defaultMessage="Trending profiles"
              description="SearchPage - Trending profile title"
            />
          </Text>
          <View>
            <TrendingProfilesList
              viewer={viewer}
              canPlay={currentRoute.route === 'SEARCH'}
            />
            <SeeAll />
          </View>
          <Text style={styles.titleSection}>
            <FormattedMessage
              defaultMessage="Profiles you may like"
              description="SearchPage - Profile recommendation title"
            />
          </Text>
          <View>
            <RecommendedProfilesList
              viewer={viewer}
              canPlay={currentRoute.route === 'SEARCH'}
            />
            <SeeAll />
          </View>
          <Text style={styles.titleSection}>
            <FormattedMessage
              defaultMessage="Trending posts"
              description="SearchPage - Trending posts title"
            />
          </Text>
        </>
      }
      canPlay={currentRoute.route === 'SEARCH'}
    />
  );
};

export default WallRecommendation;

const IMAGE_SIZE = PixelRatio.roundToNearestPixel(24);

const SeeAll = () => {
  return (
    <View style={styles.viewSeeAll} pointerEvents="box-none">
      <Pressable
        style={styles.pressableSeeAll}
        // eslint-disable-next-line no-alert
        onPress={() => alert('todo')}
      >
        <Text style={styles.seeAllFont}>
          <FormattedMessage
            defaultMessage="See all"
            description="CoverList - See all button"
          />
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  titleSection: {
    ...textStyles.sectionTitle,
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
    ...fontFamilies.semiBold,
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
