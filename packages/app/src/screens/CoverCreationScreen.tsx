import { useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, View } from 'react-native';
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
    currentUser {
      isPremium
    }
    profile: node(id: $profileId) {
      ...CoverEditor_profile
      ... on Profile {
        webCard {
          webCardKind
          id
          userName
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
    currentUser {
      isPremium
    }
    profile: node(id: $profileId) {
      ...CoverEditor_profile
      ... on Profile {
        webCard {
          webCardKind
          id
          userName
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
  const { profile, currentUser } = data;

  const [canSave, setCanSave] = useState(false);
  const coverEditorRef = useRef<CoverEditorHandle | null>(null);
  const router = useRouter();
  const intl = useIntl();
  const onBack = useCallback(() => {
    Alert.alert(
      intl.formatMessage({
        defaultMessage: 'Discard changes?',
        description: 'Edit cover discard alert title',
      }),
      intl.formatMessage({
        defaultMessage:
          'Are you sure you want to go back to select another Cover template? All unsaved changes will be lost.',
        description: 'Edit cover discard alert message',
      }),
      [
        {
          text: intl.formatMessage({
            defaultMessage: 'Continue editing',
            description:
              'Edit cover discard alert Continue editing button label',
          }),
          onPress: () => void 0,
          style: 'cancel',
        },
        {
          text: intl.formatMessage({
            defaultMessage: 'Discard edits',
            description: 'Edit cover discard alert Discard edits button label',
          }),
          onPress: () => {
            router.back();
          },
        },
      ],
    );
  }, [intl, router]);

  const onSaveCover = useCallback(() => {
    coverEditorRef.current?.save().then(() => {
      if (fromCoverEdition) {
        router.pop(2);
      } else if (profile?.webCard?.userName) {
        router.splice(
          {
            route: 'WEBCARD',
            params: {
              webCardId: profile.webCard.id,
              userName: profile.webCard.userName,
              editing: true,
              fromCreation: true,
            },
          },
          2,
        );
      }
    });
  }, [fromCoverEdition, profile?.webCard, router]);

  const onCanSaveChange = useCallback((value: boolean) => {
    setCanSave(value);
  }, []);

  const styles = useStyleSheet(stylesheet);
  const insets = useScreenInsets();

  const onConfirm = useCallback(() => {
    Alert.alert(
      intl.formatMessage({
        defaultMessage: 'Save this cover ?',
        description: 'Cover creation confirm save title',
      }),
      intl.formatMessage({
        defaultMessage: 'Do you want to save this cover now ?',
        description: 'Cover creation confirm save subtitle',
      }),
      [
        {
          text: intl.formatMessage({
            defaultMessage: 'Continue editing',
            description: 'Cover creation cancel save button label',
          }),
        },
        {
          text: intl.formatMessage({
            defaultMessage: 'Save now',
            description: 'Cover creation confirm save button label',
          }),
          onPress: onSaveCover,
          style: 'cancel',
        },
      ],
    );
  }, [intl, onSaveCover]);

  const webCardKind = profile?.webCard?.webCardKind;
  const isPremium = currentUser?.isPremium;

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
                  description="Cover creation Screen - screen title"
                />
              </Text>
              {isPremium ? null : (
                <View style={styles.proContainer}>
                  <Text variant="medium" style={styles.proText}>
                    <FormattedMessage
                      description="NewWebCardScreen - Description for pro category"
                      defaultMessage="azzapp+ WebCard{azzappA}"
                      values={{ azzappA: <Text variant="azzapp">a</Text> }}
                    />
                  </Text>
                  <PremiumIndicator isRequired />
                </View>
              )}
            </View>
          )
        }
        rightElement={
          <SaveHeaderButton
            style={{ width: 70, marginRight: 10 }}
            onPress={onConfirm}
            disabled={!canSave}
          />
        }
        rightElementWidth={80}
        backIcon="arrow_left"
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
            onCancel={onBack}
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
