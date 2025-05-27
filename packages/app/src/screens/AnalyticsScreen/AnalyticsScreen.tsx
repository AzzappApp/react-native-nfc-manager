import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import HomeStatistics from '#screens/HomeScreen/HomeStatistics';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type { ScreenOptions } from '#components/NativeRouter';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { AnalyticsScreenQuery } from '#relayArtifacts/AnalyticsScreenQuery.graphql';
import type { AnalyticsRoute } from '#routes';
const analyticsScreenQuery = graphql`
  query AnalyticsScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        ...HomeStatistics_profile
        webCard {
          id
          ...CoverRenderer_webCard
        }
        nbContactCardScans
        statsSummary {
          day
          contactCardScans
        }
      }
    }
  }
`;

const AnalyticsScreen = ({
  preloadedQuery,
}: RelayScreenProps<AnalyticsRoute, AnalyticsScreenQuery>) => {
  const { node } = usePreloadedQuery(analyticsScreenQuery, preloadedQuery);
  const router = useRouter();
  const webCard = node?.profile?.webCard;
  const { width: windowsWidth, height: windowsHeight } = useScreenDimensions();
  const { top, bottom } = useScreenInsets();
  const coverWidth =
    (windowsHeight -
      CONTAINER_STATS_HEIGHT -
      CONTAINER_STATS_TOP_MARGIN -
      ICON_VIEW_HEIGHT -
      40 -
      bottom -
      top) *
    COVER_RATIO;
  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <CoverRenderer
        width={windowsWidth * ZOOM_COVER}
        webCard={webCard}
        style={[
          styles.coverStyle,
          { left: -(windowsWidth * ZOOM_COVER - windowsWidth) / 2 },
        ]}
        canPlay={false}
      />
      <BlurView
        intensity={20} // Adjust for more/less blur
        tint="light" // "light", "dark", or "default"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(0, 0, 0,0.6)', 'rgba(0, 0, 0, 1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0.2, 0.55]}
        style={styles.linear}
      />
      <View style={[styles.viewHeader, { paddingTop: top }]}>
        <Text variant="large" style={{ color: colors.white, marginBottom: 40 }}>
          <FormattedMessage
            defaultMessage="Analytics"
            description="Analytics Screen - title"
          />
        </Text>
        <CoverRenderer webCard={webCard} width={coverWidth} canPlay />
      </View>
      <View style={styles.containerStats}>
        <HomeStatistics user={node?.profile} height={190} focused />
      </View>
      {/* using alignItems on the parent container just screw up HomeStatistics .... */}
      <View style={styles.viewIcon}>
        <IconButton
          icon="close"
          onPress={router.back}
          iconStyle={styles.iconStyle}
          style={styles.iconContainerStyle}
        />
      </View>
    </View>
  );
};
const ZOOM_COVER = 1.1;
const ICON_VIEW_HEIGHT = 120;
const CONTAINER_STATS_HEIGHT = 200;
const CONTAINER_STATS_TOP_MARGIN = 40;
const styles = StyleSheet.create({
  viewHeader: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewIcon: {
    alignItems: 'center',
    height: ICON_VIEW_HEIGHT,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  containerStats: {
    marginTop: CONTAINER_STATS_TOP_MARGIN,
    marginHorizontal: 20,
    height: CONTAINER_STATS_HEIGHT,
  },
  iconContainerStyle: {
    borderColor: 'white',
    width: 24,
  },
  iconStyle: {
    tintColor: colors.white,
  },
  coverStyle: {
    marginBottom: 0,
    borderRadius: 0,
    position: 'absolute',
    top: 0,
  },
  linear: {
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
});

const AnalyticsRelayScreen = relayScreen(AnalyticsScreen, {
  query: analyticsScreenQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
  //force a fallback black to avoid the white flash from default container(based on color scheme)
  fallback: () => <View style={styles.fallbackContainer} />,
});

AnalyticsRelayScreen.getScreenOptions = (): ScreenOptions => ({
  stackAnimation: 'slide_from_bottom',
});

export default AnalyticsRelayScreen;
