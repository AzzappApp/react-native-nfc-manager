import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  View,
  unstable_batchedUpdates,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { graphql, usePreloadedQuery } from 'react-relay';
import {
  CancelHeaderButton,
  SaveHeaderButton,
} from '#components/commonsButtons';
import CoverEditor from '#components/CoverEditor';
import coverLocalStore from '#components/CoverEditor/coversLocalStore';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import Text from '#ui/Text';
import CoverTemplateSelectionStep from './NewWebCardScreen/CoverTemplateSelectionStep';
import { PAGER_HEADER_HEIGHT } from './NewWebCardScreen/PagerHeader';
import WizardTransitioner from './NewWebCardScreen/WizardTransitioner';
import type { CoverEditorHandle } from '#components/CoverEditor/CoverEditor';
import type { CoverInfos } from '#components/CoverEditor/coversLocalStore';
import type { TemplateTypePreview } from '#components/CoverEditorTemplateList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { CoverEditionScreenQuery } from '#relayArtifacts/CoverEditionScreenQuery.graphql';
import type { CoverEditionRoute } from '#routes';
import type { ColorPaletteColor } from '@azzapp/shared/cardHelpers';

const { height: windowHeight } = Dimensions.get('screen');

const CoverEditionScreen = ({
  preloadedQuery,
}: RelayScreenProps<CoverEditionRoute, CoverEditionScreenQuery>) => {
  const intl = useIntl();
  const router = useRouter();

  const data = usePreloadedQuery(query, preloadedQuery);
  const profile = data.node?.profile ?? null;
  const [coverInitialSate, setCoverInitialSate] = useState<CoverInfos | null>(
    coverLocalStore.getSavedCover(),
  );
  const coverEditorRef = useRef<CoverEditorHandle | null>(null);
  const [canSave, setCanSave] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animationDelay, setAnimationDelay] = useState(0);

  const next = useCallback(
    (animationDelay?: number) => {
      unstable_batchedUpdates(() => {
        setAnimationDelay(animationDelay ?? 0);
        setCurrentStepIndex(page => Math.min(page + 1, 1));
      });
    },
    [setCurrentStepIndex],
  );

  const prev = useCallback(() => {
    setCurrentStepIndex(page => Math.max(0, page - 1));
  }, [setCurrentStepIndex]);

  const [coverTemplate, setCoverTemplate] = useState<{
    template: TemplateTypePreview | null;
    backgroundColor: ColorPaletteColor | null;
  } | null>(null);

  const onCoverTemplateSelected = useCallback(
    (template: {
      template: TemplateTypePreview | null;
      backgroundColor: ColorPaletteColor | null;
    }) => {
      setCoverTemplate(template);
      // we wait for the modal to open before starting the transition
      next(500);
    },
    [next],
  );

  const [filesAreAvailable, setFilesAreAvailable] = useState(false);

  const onSave = useCallback(() => {
    coverEditorRef.current?.save().then(() => {
      router.back();
    });
  }, [router]);

  const onCancel = router.back;

  // #region Layout
  const insets = useScreenInsets();
  const { width: windowWidth } = useWindowDimensions();
  const contentHeight =
    windowHeight -
    insets.top -
    (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0) -
    PAGER_HEADER_HEIGHT;
  // #endregion

  useEffect(() => {
    (async () => {
      let filesAreOk = false;

      if (
        coverInitialSate !== null &&
        coverInitialSate.coverId === profile?.webCard.coverId
      ) {
        if (!filesAreAvailable) {
          const fileExists = await Promise.all(
            coverInitialSate.medias
              .map(({ media }) => media)
              .concat(coverInitialSate.overlayLayers.map(o => o.media))
              .map(async media => {
                try {
                  return ReactNativeBlobUtil.fs.exists(
                    media.uri.replace('file://', ''),
                  );
                } catch (e) {
                  return false;
                }
              }),
          );

          filesAreOk = fileExists.every(e => e);
        }
      }

      if (!filesAreAvailable) {
        if (filesAreOk) {
          setFilesAreAvailable(true);
        } else {
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
                onPress: () => {
                  setFilesAreAvailable(true);
                  setCoverInitialSate(null);
                },
              },
              {
                text: intl.formatMessage({
                  defaultMessage: 'Cancel',
                  description: 'Alert button to cancel editing the cover',
                }),
                style: 'cancel',
                onPress: onCancel,
              },
            ],
          );
        }
      }
    })();
  }, [
    coverInitialSate,
    filesAreAvailable,
    intl,
    onCancel,
    profile?.webCard.coverId,
  ]);

  const onBack = useCallback(() => {
    if (currentStepIndex === 1) {
      prev();
    } else {
      router.back();
    }
  }, [currentStepIndex, prev, router]);

  if (!profile) {
    // TODO handle erroneous case
    return null;
  }

  if (!filesAreAvailable) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  if (coverInitialSate === null) {
    const steps = [
      {
        title: intl.formatMessage({
          defaultMessage: 'Select a cover template',
          description: 'Cover template selection screen title',
        }),
        element: (
          <CoverTemplateSelectionStep
            profileId={profile.id}
            height={contentHeight}
            onTemplateSelected={onCoverTemplateSelected}
          />
        ),
        backIcon: 'arrow_down' as const,
        rightElement: <View style={{ height: HEADER_HEIGHT }} />,
        rightElementWidth: 80,
      },
      {
        title: (
          <View style={styles.container}>
            <Text variant="large">
              <FormattedMessage
                defaultMessage="Create your cover"
                description="Cover creation screen title"
              />
            </Text>
          </View>
        ),
        element:
          coverTemplate && currentStepIndex === 1 ? (
            <CoverEditor
              profile={profile}
              onCanSaveChange={setCanSave}
              coverTemplatePreview={coverTemplate.template}
              backgroundColor={coverTemplate.backgroundColor}
              ref={coverEditorRef}
              style={{ height: contentHeight }}
            />
          ) : null,
        backIcon: 'arrow_down' as const,
        rightElement: (
          <SaveHeaderButton
            style={styles.saveButton}
            onPress={onSave}
            disabled={!canSave}
          />
        ),
        rightElementWidth: 80,
      },
    ];

    return (
      <WizardTransitioner
        currentStepIndex={currentStepIndex}
        animationDelay={animationDelay}
        steps={steps}
        width={windowWidth}
        contentHeight={contentHeight}
        onBack={onBack}
        style={{
          flex: 1,
          paddingTop: insets.top,
        }}
      />
    );
  } else {
    return (
      <Container
        style={{
          flex: 1,
          paddingTop: insets.top,
        }}
      >
        <Header
          middleElement={intl.formatMessage({
            defaultMessage: 'Edit your cover',
            description: 'CoverEditionScreen header title',
          })}
          leftElement={<CancelHeaderButton onPress={onCancel} />}
          rightElement={
            <SaveHeaderButton disabled={!canSave} onPress={onSave} />
          }
        />
        <View style={styles.changeCover}>
          <Button
            variant="little_round"
            onPress={() => {
              setCoverInitialSate(null);
            }}
            label={intl.formatMessage({
              defaultMessage: 'New cover',
              description: 'Button to create a new cover',
            })}
          />
        </View>
        <CoverEditor
          profile={profile}
          onCanSaveChange={setCanSave}
          coverTemplatePreview={null}
          backgroundColor={profile.webCard.coverBackgroundColor}
          ref={coverEditorRef}
          coverInitialSate={coverInitialSate}
          style={{ flex: 1 }}
        />
      </Container>
    );
  }
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
          webCardKind
          coverId
        }
      }
    }
  }
`;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
  },
  changeCover: { paddingHorizontal: 50, paddingTop: 30 },
  saveButton: { width: 70, marginRight: 10 },
});

export default relayScreen(CoverEditionScreen, {
  query,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
});
