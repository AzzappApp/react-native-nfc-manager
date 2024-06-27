import { Suspense, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { isWebCardKindSubscription } from '@azzapp/shared/subscriptionHelpers';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import { HEADER_HEIGHT } from '#ui/Header';
import Text from '#ui/Text';
import WizardPagerHeader from '#ui/WizardPagerHeader';
import CoverTemplateList from './CoverTemplateList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CoverTemplateList_profile$key } from '#relayArtifacts/CoverTemplateList_profile.graphql';
import type { CoverTemplateSelectionScreenQuery } from '#relayArtifacts/CoverTemplateSelectionScreenQuery.graphql';
import type { CoverTemplateSelectionRoute } from '#routes';
import type { ColorPaletteColor } from '@azzapp/shared/cardHelpers';
const query = graphql`
  query CoverTemplateSelectionScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ...CoverTemplateList_profile
      ... on Profile {
        webCard {
          webCardKind
        }
      }
    }
  }
`;

const CoverTemplateSelectionScreen = ({
  route: { params: { fromCoverEdition } = {} },
  preloadedQuery,
}: RelayScreenProps<
  CoverTemplateSelectionRoute,
  CoverTemplateSelectionScreenQuery
>) => {
  const router = useRouter();
  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const { profile } = usePreloadedQuery<CoverTemplateSelectionScreenQuery>(
    query,
    preloadedQuery,
  );

  const webCardKind = profile?.webCard?.webCardKind;

  const onSelectTemplate = useCallback(
    (templateId: string) => {
      router.push({
        route: 'COVER_CREATION',
        params: {
          templateId,
          fromCoverEdition: !!fromCoverEdition,
        },
      });
    },
    [router, fromCoverEdition],
  );

  const onSelectBackgroundColor = useCallback(
    (color: ColorPaletteColor) => {
      router.push({
        route: 'COVER_CREATION',
        params: { color, fromCoverEdition: !!fromCoverEdition },
      });
    },
    [router, fromCoverEdition],
  );

  const styles = useStyleSheet(stylesheet);
  const intl = useIntl();
  const insets = useScreenInsets();
  return (
    <Container style={{ paddingTop: insets.top, flex: 1 }}>
      <Suspense
        fallback={
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator />
          </View>
        }
      >
        <WizardPagerHeader
          title={
            webCardKind && !isWebCardKindSubscription(webCardKind) ? (
              intl.formatMessage({
                defaultMessage: 'Create your cover',
                description: 'Cover creation screen title',
              })
            ) : (
              <View style={styles.titleContainer}>
                <Text variant="large" style={styles.titleText}>
                  {intl.formatMessage({
                    defaultMessage: 'Create your Cover',
                    description: 'Cover creation screen title',
                  })}
                </Text>
                <View style={styles.proContainer}>
                  <Text variant="medium" style={styles.proText}>
                    <FormattedMessage
                      defaultMessage="azzapp+ WebCard"
                      description="Cover creation with pro template"
                    />
                  </Text>
                  <PremiumIndicator isRequired />
                </View>
              </View>
            )
          }
          rightElement={<View style={{ height: HEADER_HEIGHT }} />}
          rightElementWidth={80}
          backIcon="arrow_down"
          currentPage={fromCoverEdition ? 0 : 2}
          nbPages={fromCoverEdition ? 2 : 5}
          onBack={onBack}
        />
        <View style={{ flex: 1 }}>
          <CoverTemplateSelectionScreenInner
            profileData={profile}
            onSelectBackgroundColor={onSelectBackgroundColor}
            onSelectTemplate={onSelectTemplate}
          />
        </View>
      </Suspense>
    </Container>
  );
};

const CoverTemplateSelectionScreenInner = ({
  profileData,
  onSelectBackgroundColor,
  onSelectTemplate,
}: {
  profileData: CoverTemplateList_profile$key | null;
  onSelectBackgroundColor: (color: ColorPaletteColor) => void;
  onSelectTemplate: (templateId: string) => void;
}) => {
  if (!profileData) {
    return null;
  }

  return (
    <CoverTemplateList
      profile={profileData}
      onSelectBackgroundColor={onSelectBackgroundColor}
      onSelectTemplate={onSelectTemplate}
    />
  );
};

export default relayScreen(CoverTemplateSelectionScreen, {
  query,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
  getScreenOptions: ({ fromHome } = {}) =>
    fromHome
      ? {
          replaceAnimation: 'push',
          stackAnimation: 'slide_from_bottom',
        }
      : { replaceAnimation: 'push' },
});

const stylesheet = createStyleSheet(() => ({
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  proText: {
    color: colors.grey400,
  },
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    textAlign: 'center',
    textAlignVertical: 'center',
  },
}));
