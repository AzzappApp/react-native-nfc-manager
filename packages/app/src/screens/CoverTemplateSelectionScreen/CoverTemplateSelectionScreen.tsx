import { Suspense, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
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
import type { CoverTemplateSelectionScreenQuery } from '#relayArtifacts/CoverTemplateSelectionScreenQuery.graphql';
import type { CoverTemplateSelectionRoute } from '#routes';
import type { ColorPaletteColor } from '@azzapp/shared/cardHelpers';
import type { PreloadedQuery } from 'react-relay';

const query = graphql`
  query CoverTemplateSelectionScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ...CoverTemplateList_profile
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
      <WizardPagerHeader
        title={intl.formatMessage(
          {
            defaultMessage: 'Select a Cover{azzappA} template',
            description: 'Cover template selection screen title',
          },
          { azzappA: <Text variant="azzapp">a</Text> },
        )}
        rightElement={<View style={{ height: HEADER_HEIGHT }} />}
        rightElementWidth={80}
        backIcon="arrow_down"
        currentPage={fromCoverEdition ? 0 : 2}
        nbPages={fromCoverEdition ? 2 : 5}
        onBack={onBack}
      />
      <View style={{ flex: 1 }}>
        <Suspense
          fallback={
            <View style={styles.activityIndicatorContainer}>
              <ActivityIndicator />
            </View>
          }
        >
          <View style={{ flex: 1 }}>
            <CoverTemplateSelectionScreenInner
              preloadedQuery={preloadedQuery}
              onSelectBackgroundColor={onSelectBackgroundColor}
              onSelectTemplate={onSelectTemplate}
            />
          </View>
        </Suspense>
      </View>
    </Container>
  );
};

const CoverTemplateSelectionScreenInner = ({
  preloadedQuery,
  onSelectBackgroundColor,
  onSelectTemplate,
}: {
  preloadedQuery: PreloadedQuery<CoverTemplateSelectionScreenQuery>;
  onSelectBackgroundColor: (color: ColorPaletteColor) => void;
  onSelectTemplate: (templateId: string) => void;
}) => {
  const data = usePreloadedQuery<CoverTemplateSelectionScreenQuery>(
    query,
    preloadedQuery,
  );
  if (!data.profile) {
    return null;
  }
  return (
    <CoverTemplateList
      profile={data.profile}
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
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
