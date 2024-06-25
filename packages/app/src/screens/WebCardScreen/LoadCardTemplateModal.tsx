import { Suspense, useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment } from 'react-relay';
import {
  moduleCountRequiresSubscription,
  webCardRequiresSubscription,
} from '@azzapp/shared/subscriptionHelpers';
import { colors } from '#theme';
import CardTemplateList from '#components/CardTemplateList';
import { useRouter } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import ScreenModal from '#components/ScreenModal';
import useAuthState from '#hooks/useAuthState';
import useLoadCardTemplateMutation from '#hooks/useLoadCardTemplateMutation';
import useScreenInsets from '#hooks/useScreenInsets';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import type {
  CardTemplateListHandle,
  CardTemplateItem,
} from '#components/CardTemplateList';
import type { LoadCardTemplateModal_webCard$key } from '#relayArtifacts/LoadCardTemplateModal_webCard.graphql';

type LoadCardTemplateModalProps = {
  onClose: (templateLoaded: boolean) => void;
  visible: boolean;
  webCard: LoadCardTemplateModal_webCard$key;
};

const LoadCardTemplateModal = ({
  onClose,
  visible,
  webCard: webCardKey,
}: LoadCardTemplateModalProps) => {
  const [cardTemplate, setCardTemplate] = useState<CardTemplateItem | null>(
    null,
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<CardTemplateItem | null>(null);

  const webCard = useFragment(
    graphql`
      fragment LoadCardTemplateModal_webCard on WebCard {
        id
        webCardKind
        cardIsPublished
        isPremium
        cardModules {
          id
          kind
        }
      }
    `,
    webCardKey,
  );
  const profileId = useAuthState().profileInfos?.profileId;

  const intl = useIntl();
  const insets = useScreenInsets();
  const { height: windowHeight } = useWindowDimensions();
  const height = windowHeight - insets.top - insets.bottom - HEADER_HEIGHT;

  const [commit, inFlight] = useLoadCardTemplateMutation();
  const [loading, setIsLoading] = useState(false);

  const commitCardTemplate = useCallback(
    (id: string) => {
      setIsLoading(true);
      commit({
        variables: {
          webCardId: webCard.id,
          cardTemplateId: id,
        },
        onCompleted: () => {
          setCardTemplate(null);
          onClose(true);
          setIsLoading(false);
        },
        onError: error => {
          console.error(error);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error, could not load the template',
              description: 'Load card template modal error toast',
            }),
          });
        },
      });
    },
    [commit, intl, onClose, webCard.id],
  );

  const router = useRouter();

  const cardTemplateHandle = useRef<CardTemplateListHandle>(null);
  const onSubmit = useCallback(() => {
    if (!cardTemplate) return;
    const requireSubscription = webCardRequiresSubscription(
      cardTemplate.modules,
      webCard.webCardKind,
    );

    if (webCard.cardIsPublished && requireSubscription && !webCard.isPremium) {
      router.push({ route: 'USER_PAY_WALL' });
      return;
    }
    commitCardTemplate(cardTemplate.id);
  }, [
    cardTemplate,
    commitCardTemplate,
    router,
    webCard.cardIsPublished,
    webCard.isPremium,
    webCard.webCardKind,
  ]);

  const showWarning = Boolean(webCard.cardModules?.length);

  const applyTemplate = useCallback(
    (template: CardTemplateItem) => {
      setCardTemplate(template);
      if (!showWarning) {
        const requireSubscription = webCardRequiresSubscription(
          template.modules,
          webCard.webCardKind,
        );

        if (
          webCard.cardIsPublished &&
          requireSubscription &&
          !webCard.isPremium
        ) {
          router.push({ route: 'USER_PAY_WALL' });
          return;
        }

        commitCardTemplate(template.id);
      }
    },
    [
      commitCardTemplate,
      router,
      showWarning,
      webCard.cardIsPublished,
      webCard.isPremium,
      webCard.webCardKind,
    ],
  );

  if (!profileId) {
    return null;
  }

  return (
    <>
      <ScreenModal animationType="none" visible={visible}>
        <Container
          style={{
            flex: 1,
            paddingBottom: insets.bottom,
            paddingTop: insets.top,
          }}
        >
          <Header
            leftElement={
              <IconButton
                icon="arrow_down"
                onPress={() => onClose(false)}
                iconSize={28}
                variant="icon"
              />
            }
            middleElement={
              <View style={styles.middleContainer}>
                <Text variant="large">
                  <FormattedMessage
                    defaultMessage="Load a template"
                    description="WebCard creation screen title"
                  />
                </Text>

                {selectedTemplate &&
                  moduleCountRequiresSubscription(
                    selectedTemplate.modules.length,
                  ) && (
                    <View style={styles.proContainer}>
                      <Text variant="medium" style={styles.proText}>
                        <FormattedMessage
                          defaultMessage="3+ visible sections"
                          description="WebCard create pro description"
                        />
                      </Text>
                      <PremiumIndicator isRequired={!webCard.isPremium} />
                    </View>
                  )}
              </View>
            }
            rightElement={
              <HeaderButton
                onPress={() => cardTemplateHandle.current?.onSubmit()}
                label={intl.formatMessage({
                  defaultMessage: 'Apply',
                  description: 'Apply button label in card template preview',
                })}
                loading={inFlight}
              />
            }
            style={{ marginBottom: 10 }}
          />
          <Suspense
            fallback={
              <View style={styles.activityIndicatorContainer}>
                <ActivityIndicator />
              </View>
            }
          >
            <CardTemplateList
              profileId={profileId}
              height={height}
              onApplyTemplate={applyTemplate}
              loading={inFlight}
              ref={cardTemplateHandle}
              onSelectTemplate={setSelectedTemplate}
            />
          </Suspense>
        </Container>
      </ScreenModal>
      <ScreenModal
        animationType="none"
        visible={
          visible && !!cardTemplate && !loading && !inFlight && showWarning
        }
      >
        <Container style={styles.confirmation}>
          <Icon icon="warning" style={styles.icon} />
          <Text variant="large" style={{ marginTop: 10 }}>
            <FormattedMessage
              defaultMessage="Delete your current WebCard{azzappA} contents?"
              description="Confirmation title for load card template modal"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          </Text>
          <Text
            style={{
              marginTop: 20,
              textAlign: 'center',
              paddingHorizontal: 20,
            }}
          >
            <FormattedMessage
              defaultMessage="Loading a new template will remove current contents of your WebCard{azzappA} and replace them with the new template. Are you ready to start from the scratch?"
              description="Confirmation description for load card template modal"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          </Text>
          <View style={styles.buttons}>
            <Button
              style={{ marginTop: 20, width: '100%' }}
              label={intl.formatMessage(
                {
                  defaultMessage: 'Remove WebCard{azzappA} contents',
                  description:
                    'Confirmation button for load card template modal',
                },
                {
                  azzappA: (
                    <Text style={{ color: colors.white }} variant="azzapp">
                      a
                    </Text>
                  ),
                },
              )}
              onPress={onSubmit}
            />
            <Button
              style={{ marginTop: 10, width: '100%' }}
              variant="secondary"
              label={intl.formatMessage({
                defaultMessage: 'Cancel',
                description: 'Cancel button for load card template modal',
              })}
              onPress={() => setCardTemplate(null)}
            />
          </View>
        </Container>
      </ScreenModal>
    </>
  );
};

export default LoadCardTemplateModal;

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 200,
  },
  confirmation: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  icon: {
    width: 60,
    height: 60,
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    paddingHorizontal: 40,
    width: '100%',
  },
  middleContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proText: {
    color: colors.grey400,
  },
  badge: {
    marginLeft: 5,
  },
});
