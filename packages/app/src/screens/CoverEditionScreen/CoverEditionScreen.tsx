import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, StyleSheet, View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import {
  CancelHeaderButton,
  SaveHeaderButton,
} from '#components/commonsButtons';
import CoverEditor from '#components/CoverEditor';
import { useRouter } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import relayScreen from '#helpers/relayScreen';
import useLatestCallback from '#hooks/useLatestCallback';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import LoadingView from '#ui/LoadingView';
import Text from '#ui/Text';
import useLocalCover from './useLocalCover';
import type { CoverEditorHandle } from '#components/CoverEditor';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CoverEditionScreenQuery } from '#relayArtifacts/CoverEditionScreenQuery.graphql';
import type { CoverEditionRoute } from '#routes';

const CoverEditionScreen = ({
  preloadedQuery,
}: RelayScreenProps<CoverEditionRoute, CoverEditionScreenQuery>) => {
  const data = usePreloadedQuery(query, preloadedQuery);
  const profile = data.node?.profile;
  const requiresSubscription = profile?.webCard?.requiresSubscription;

  const [canSave, setCanSave] = useState(false);
  const [coverModified, setCoverModified] = useState(false);
  const [saving, setSaving] = useState(false);
  const coverEditorRef = useRef<CoverEditorHandle | null>(null);
  const inset = useScreenInsets();

  const { cover: savedCoverState, loading } = useLocalCover(
    saving,
    profile?.webCard?.id,
    profile?.webCard?.coverId,
  );
  const router = useRouter();
  const intl = useIntl();
  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  const onSave = useCallback(() => {
    if (canSave) {
      setSaving(true);
      coverEditorRef.current
        ?.save()
        .then(() => {
          setSaving(false);
          router.back();
        })
        .finally(() => {
          setSaving(false);
        });
    }
  }, [canSave, router]);

  const onConfirm = useCallback(() => {
    Alert.alert(
      intl.formatMessage({
        defaultMessage: 'Save this cover ?',
        description: 'Cover Edition confirm save title',
      }),
      intl.formatMessage({
        defaultMessage: 'Do you want to save this cover now ?',
        description: 'Cover Edition confirm save subtitle',
      }),
      [
        {
          text: intl.formatMessage({
            defaultMessage: 'Continue editing',
            description: 'Cover Edition eation cancel save button label',
          }),
        },
        {
          text: intl.formatMessage({
            defaultMessage: 'Save now',
            description: 'Cover Edition confirm save button label',
          }),
          onPress: onSave,
          style: 'cancel',
        },
      ],
    );
  }, [intl, onSave]);

  const onNewCover = useCallback(() => {
    router.replace({
      route: 'COVER_TEMPLATE_SELECTION',
      params: {
        fromCoverEdition: true,
      },
    });
  }, [router]);

  const onCanSaveChange = useCallback((value: boolean) => {
    setCanSave(value);
  }, []);

  const onCoverModified = useCallback(() => {
    setCoverModified(true);
  }, []);

  const hasCover = !!savedCoverState;
  const onCancelRef = useLatestCallback(onCancel);
  useEffect(() => {
    if (data.node?.profile?.webCard?.coverIsPredefined) {
      onNewCover();
    } else if (!loading && !hasCover) {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: 'Some files are missing',
          description: 'Alert title when some files are missing',
        }),
        intl.formatMessage({
          defaultMessage:
            'Some files used in the cover are missing. You will have to create a new cover.',
          description: 'Alert message when some files are missing',
        }),
        [
          {
            text: intl.formatMessage({
              defaultMessage: 'Continue',
              description: 'Alert button to continue editing the cover',
            }),
            style: 'default',
            onPress: onNewCover,
          },
          {
            text: intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Alert button to cancel editing the cover',
            }),
            style: 'cancel',
            onPress: onCancelRef,
          },
        ],
      );
    }
  }, [
    data.node?.profile?.webCard?.coverIsPredefined,
    hasCover,
    intl,
    loading,
    onCancelRef,
    onNewCover,
  ]);

  if (!profile) {
    return null;
  }

  const { isPremium } = profile.webCard ?? {};

  return (
    <Container
      style={[
        styles.container,
        { paddingBottom: inset.bottom, paddingTop: inset.top },
      ]}
    >
      <Header
        middleElement={
          <View style={styles.headerTextContainer}>
            <Text variant="large">
              <FormattedMessage
                defaultMessage="Edit your cover"
                description="CoverEditionScreen header title"
              />
            </Text>
            {requiresSubscription && !isPremium && (
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
        }
        leftElement={<CancelHeaderButton onPress={onCancel} />}
        rightElement={
          <SaveHeaderButton
            disabled={!canSave || !coverModified}
            onPress={onConfirm}
            style={styles.saveButton}
          />
        }
      />
      {hasCover ? (
        <View style={styles.container}>
          <View style={styles.changeCover}>
            <Button
              variant="little_round"
              onPress={onNewCover}
              label={intl.formatMessage({
                defaultMessage: 'New cover',
                description: 'Button to create a new cover',
              })}
            />
          </View>
          <CoverEditor
            ref={coverEditorRef}
            profile={profile}
            // template infos are saved in the cover state
            coverInitialState={savedCoverState}
            coverTemplate={null}
            onCanSaveChange={onCanSaveChange}
            onCoverModified={onCoverModified}
            backgroundColor={profile.webCard?.coverBackgroundColor ?? null}
            style={styles.container}
            onCancel={onCancel}
          />
        </View>
      ) : (
        <LoadingView />
      )}
    </Container>
  );
};

const query = graphql`
  query CoverEditionScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        id
        ...CoverEditor_profile
        webCard {
          id
          coverBackgroundColor
          coverId
          requiresSubscription
          isPremium
          coverIsPredefined
        }
      }
    }
  }
`;

export default relayScreen(CoverEditionScreen, {
  query,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  changeCover: { paddingHorizontal: 50, paddingTop: 30 },
  saveButton: { width: 70 },
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
});
