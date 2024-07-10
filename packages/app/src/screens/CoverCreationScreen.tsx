import { useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import { SaveHeaderButton } from '#components/commonsButtons';
import CoverEditor from '#components/CoverEditor';
import { useRouter } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Text from '#ui/Text';
import WizardPagerHeader from '#ui/WizardPagerHeader';
import type { CoverEditorHandle } from '#components/CoverEditor/CoverEditor';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CoverCreationScreenCoverTemplateQuery } from '#relayArtifacts/CoverCreationScreenCoverTemplateQuery.graphql';
import type { CoverCreationScreenQuery } from '#relayArtifacts/CoverCreationScreenQuery.graphql';
import type { CoverCreationRoute } from '#routes';

const queryWithCoverTemplate = graphql`
  query CoverCreationScreenCoverTemplateQuery(
    $profileId: ID!
    $coverTemplateId: ID!
  ) {
    profile: node(id: $profileId) {
      ...CoverEditor_profile
      ... on Profile {
        webCard {
          webCardKind
        }
      }
    }
    coverTemplate: node(id: $coverTemplateId) {
      ...CoverEditor_coverTemplate
      ... on CoverTemplate {
        id
        lottie
      }
    }
  }
`;

const queryWithoutCoverTemplate = graphql`
  query CoverCreationScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ...CoverEditor_profile
      ... on Profile {
        webCard {
          webCardKind
        }
      }
    }
  }
`;

const CoverCreationScreen = ({
  route: {
    params: { templateId, color, fromCoverEdition },
  },
  preloadedQuery,
}: RelayScreenProps<
  CoverCreationRoute,
  CoverCreationScreenCoverTemplateQuery | CoverCreationScreenQuery
>) => {
  const data = usePreloadedQuery(
    templateId ? queryWithCoverTemplate : queryWithoutCoverTemplate,
    preloadedQuery,
  );

  const [canSave, setCanSave] = useState(false);
  const coverEditorRef = useRef<CoverEditorHandle | null>(null);
  const router = useRouter();

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const onSaveCover = useCallback(() => {
    coverEditorRef.current?.save().then(() => {
      if (fromCoverEdition) {
        router.pop(2);
      } else {
        router.splice({ route: 'WEBCARD_TEMPLATE_SELECTION' }, 2);
      }
    });
  }, [fromCoverEdition, router]);

  const onCanSaveChange = useCallback((value: boolean) => {
    setCanSave(value);
  }, []);

  const styles = useStyleSheet(stylesheet);
  const insets = useScreenInsets();
  const intl = useIntl();

  const { profile } = data;
  const webCardKind = profile?.webCard?.webCardKind;

  return (
    <Container
      style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <WizardPagerHeader
        title={
          webCardKind === 'personal' ? (
            intl.formatMessage({
              defaultMessage: 'Create your cover',
              description: 'Cover creation screen title',
            })
          ) : (
            <View style={styles.headerTextContainer}>
              <Text variant="large">
                <FormattedMessage
                  defaultMessage="Create your cover"
                  description="Cover creation screen title"
                />
              </Text>
              <View style={styles.proContainer}>
                <Text variant="medium" style={styles.proText}>
                  <FormattedMessage
                    description="NewWebCardScreen - Description for pro category"
                    defaultMessage="Professional WebCard"
                  />
                </Text>
                <PremiumIndicator isRequired />
              </View>
            </View>
          )
        }
        rightElement={
          <SaveHeaderButton
            style={{ width: 70, marginRight: 10 }}
            onPress={onSaveCover}
            disabled={!canSave}
          />
        }
        rightElementWidth={80}
        backIcon="arrow_left"
        currentPage={fromCoverEdition ? 1 : 3}
        nbPages={fromCoverEdition ? 3 : 5}
        onBack={onBack}
      />
      <View style={{ flex: 1 }}>
        {profile != null && (
          <CoverEditor
            ref={coverEditorRef}
            profile={profile}
            coverTemplate={'coverTemplate' in data ? data.coverTemplate : null}
            backgroundColor={color ?? null}
            onCanSaveChange={onCanSaveChange}
          />
        )}
      </View>
    </Container>
  );
};

export default relayScreen(CoverCreationScreen, {
  query: ({ templateId }) =>
    templateId ? queryWithCoverTemplate : queryWithoutCoverTemplate,
  getVariables: ({ templateId }, profileInfos) => {
    return {
      coverTemplateId: templateId,
      profileId: profileInfos?.profileId,
    };
  },
});

const stylesheet = createStyleSheet(() => ({
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  proText: {
    color: colors.grey400,
  },
  proContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
}));
