import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import {
  graphql,
  useFragment,
  usePreloadedQuery,
  useRefetchableFragment,
} from 'react-relay';
import { isWebCardKindSubscription } from '@azzapp/shared/subscriptionHelpers';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import { HEADER_HEIGHT } from '#ui/Header';
import Text from '#ui/Text';
import WizardPagerHeader from '#ui/WizardPagerHeader';
import CoverTemplateList, {
  CoverTemplateListFallback,
} from './CoverTemplateList';
import CoverTemplateScratchStarters, {
  CoverTemplateScratchStartersFallback,
} from './CoverTemplateScratchStarter';
import CoverTemplateTagSelector, {
  CoverTemplateTagSelectorFallback,
} from './CoverTemplateTagSelector';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CoverTemplateSelectionScreenBody_listProfile$key } from '#relayArtifacts/CoverTemplateSelectionScreenBody_listProfile.graphql';
import type { CoverTemplateSelectionScreenBody_profile$key } from '#relayArtifacts/CoverTemplateSelectionScreenBody_profile.graphql';
import type { CoverTemplateSelectionScreenQuery } from '#relayArtifacts/CoverTemplateSelectionScreenQuery.graphql';
import type { CoverTemplateSelectionRoute } from '#routes';
import type { ColorPaletteColor } from '@azzapp/shared/cardHelpers';

const query = graphql`
  query CoverTemplateSelectionScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ...CoverTemplateSelectionScreenBody_profile
      ... on Profile {
        webCard {
          webCardKind
          cardIsPublished
          isPremium
        }
        invited
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

  useEffect(() => {
    if (profile?.invited) {
      router.backToTop();
    }
  }, [profile?.invited, profile?.webCard?.cardIsPublished, router]);

  const webCardKind = profile?.webCard?.webCardKind;

  const onSelectTemplate = useCallback(
    (templateId: string, color?: ColorPaletteColor) => {
      router.push({
        route: 'COVER_CREATION',
        params: {
          templateId,
          fromCoverEdition: !!fromCoverEdition,
          color,
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
                  description: 'Cover Template Selection Screen - screen title',
                })}
              </Text>
              {!profile?.webCard?.isPremium && (
                <View style={styles.proContainer}>
                  <Text variant="medium" style={styles.proText}>
                    <FormattedMessage
                      defaultMessage="azzapp+ WebCard{azzappA}"
                      values={{ azzappA: <Text variant="azzapp">a</Text> }}
                      description="Cover creation with pro template"
                    />
                  </Text>
                  <PremiumIndicator isRequired />
                </View>
              )}
            </View>
          )
        }
        rightElement={<View style={{ height: HEADER_HEIGHT }} />}
        rightElementWidth={80}
        backIcon="arrow_down"
        onBack={onBack}
      />
      <Suspense
        fallback={
          <View style={styles.body}>
            <CoverTemplateTagSelectorFallback />
            <CoverTemplateListFallback
              ListFooterComponent={<CoverTemplateScratchStartersFallback />}
            />
          </View>
        }
      >
        {profile && (
          <CoverTemplateSelectionScreenBody
            profile={profile}
            onSelectBackgroundColor={onSelectBackgroundColor}
            onSelectTemplate={onSelectTemplate}
          />
        )}
      </Suspense>
    </Container>
  );
};

type CoverTemplateSelectionScreenBodyProps = {
  profile: CoverTemplateSelectionScreenBody_profile$key;
  onSelectTemplate: (templateId: string) => void;
  onSelectBackgroundColor: (color: ColorPaletteColor) => void;
};

const CoverTemplateSelectionScreenBody = ({
  profile: profileKey,
  onSelectTemplate,
  onSelectBackgroundColor,
}: CoverTemplateSelectionScreenBodyProps) => {
  const profile = useFragment(
    graphql`
      fragment CoverTemplateSelectionScreenBody_profile on Profile {
        coverTemplateTags {
          ...CoverTemplateTagSelector_tags
        }
        ...CoverTemplateSelectionScreenBody_listProfile
        webCard {
          cardColors {
            light
            dark
            primary
          }
        }
      }
    `,
    profileKey,
  );

  const [listProfile, refetch] = useRefetchableFragment(
    graphql`
      fragment CoverTemplateSelectionScreenBody_listProfile on Profile
      @refetchable(queryName: "CoverTemplateSelectionScreenProfileRefetchQuery")
      @argumentDefinitions(tagId: { type: ID, defaultValue: null }) {
        ...CoverTemplateList_profile @arguments(tagId: $tagId)
      }
    `,
    profile as CoverTemplateSelectionScreenBody_listProfile$key,
  );

  const [tag, setTag] = useState<string | null>(null);

  const onSelectTag = useCallback(
    (tagId: string | null) => {
      setTag(tagId);
      refetch({ tagId }, { fetchPolicy: 'store-and-network' });
    },
    [refetch],
  );

  const styles = useStyleSheet(stylesheet);

  const ListFooterComponent = useMemo(() => {
    if (tag) return undefined;

    return (
      <CoverTemplateScratchStarters
        onColorSelect={onSelectBackgroundColor}
        cardColors={profile.webCard?.cardColors}
      />
    );
  }, [onSelectBackgroundColor, profile.webCard?.cardColors, tag]);

  return (
    <View style={styles.body}>
      <CoverTemplateTagSelector
        tags={profile.coverTemplateTags}
        selected={tag}
        onSelect={onSelectTag}
      />

      <Suspense
        fallback={
          <CoverTemplateListFallback
            ListFooterComponent={ListFooterComponent}
          />
        }
      >
        <CoverTemplateList
          profile={listProfile!}
          tag={tag}
          ListFooterComponent={ListFooterComponent}
          onSelectTemplate={onSelectTemplate}
        />
      </Suspense>
    </View>
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
  titleText: {
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  body: {
    flex: 1,
  },
}));
