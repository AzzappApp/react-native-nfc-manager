import { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors, shadow } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import {
  useRouter,
  ScreenModal,
  preventModalDismiss,
} from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { WebCardScreenPublishHelper_webCard$key } from '#relayArtifacts/WebCardScreenPublishHelper_webCard.graphql';
import type { WebCardScreenPublishHelperMutation } from '#relayArtifacts/WebCardScreenPublishHelperMutation.graphql';

type ProfileScreenPublishHelperProps = {
  webCard: WebCardScreenPublishHelper_webCard$key;
  editMode: boolean;
};

const WebCardScreenPublishHelper = ({
  webCard: webCardKey,
  editMode,
}: ProfileScreenPublishHelperProps) => {
  const webCard = useFragment(
    graphql`
      fragment WebCardScreenPublishHelper_webCard on WebCard {
        id
        userName
        cardIsPublished
        requiresSubscription
        isPremium
        cardModules {
          id
        }
        ...CoverRenderer_webCard
      }
    `,
    webCardKey,
  );

  const {
    id: webCardId,
    userName,
    cardIsPublished,
    requiresSubscription,
    isPremium,
    cardModules,
  } = webCard;

  const intl = useIntl();

  const [commit, publishing] = useMutation<WebCardScreenPublishHelperMutation>(
    graphql`
      mutation WebCardScreenPublishHelperMutation(
        $webCardId: ID!
        $input: ToggleWebCardPublishedInput!
      ) {
        toggleWebCardPublished(webCardId: $webCardId, input: $input) {
          webCard {
            id
            cardIsPublished
          }
        }
      }
    `,
  );

  const { bottom } = useScreenInsets();

  useEffect(() => {
    if (!cardIsPublished && editMode && cardModules.length > 0) {
      Toast.show({
        type: 'info',
        bottomOffset: bottom + BOTTOM_MENU_HEIGHT,
        autoHide: false,
        text1: intl.formatMessage(
          {
            defaultMessage:
              'Tap on a section of your WebCard{azzappA} to modify it',
            description:
              'Toast info message that appears when the user is in webcard edit mode for the first time',
          },
          {
            azzappA: <Text variant="azzapp">a</Text>,
          },
        ) as string,
        props: {
          showClose: true,
        },
      });
    }

    return () => {
      Toast.hide();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

  const [showPublishModal, setShowPublishModal] = useState(false);

  const editModeRef = useRef(editMode);
  const router = useRouter();

  useEffect(() => {
    if (!cardIsPublished && !editMode && editModeRef.current) {
      setShowPublishModal(true);
    }
    editModeRef.current = editMode;
  }, [cardIsPublished, editMode]);

  const onPublish = () => {
    if (requiresSubscription && !isPremium) {
      router.push({ route: 'USER_PAY_WALL' });
      return;
    }

    commit({
      variables: {
        webCardId,
        input: {
          published: true,
        },
      },
      onCompleted: () => {
        setShowPublishModal(false);
        router.backToTop();
      },
      onError: error => {
        console.error(error);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage(
            {
              defaultMessage:
                'Error, could not publish your WebCard{azzappA}, try again later',
              description: 'Publish modal error toast',
            },
            {
              azzappA: <Text variant="azzapp">a</Text>,
            },
          ) as string,
        });
      },
    });
  };

  const onClose = () => {
    setShowPublishModal(false);
    router.backToTop();
  };
  const url = buildUserUrl(userName);

  const styles = useStyleSheet(stylesheet);

  const insets = useScreenInsets();
  return (
    <ScreenModal
      animationType="fade"
      visible={showPublishModal}
      onRequestDismiss={preventModalDismiss}
      gestureEnabled={false}
    >
      <Container
        style={[
          styles.container,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <CoverRenderer width={200} webCard={webCard} />
        <View style={styles.viewBottom}>
          <Text variant="xlarge" style={styles.text}>
            <FormattedMessage
              defaultMessage="Congratulations!"
              description="Publish modal title"
            />
          </Text>
          <Text variant="medium" style={styles.text}>
            <FormattedMessage
              defaultMessage="Your personal WebCard{azzappA}, visible both in app and online, is created."
              description="Publish modal subtitle"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          </Text>
          <Text variant="medium" style={styles.text}>
            <FormattedMessage
              defaultMessage="Your WebCard{azzappA} url is:"
              description="Publish modal url label"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          </Text>
          <Container style={styles.urlContainer}>
            <Icon icon="earth" style={styles.iconLink} />
            <Text variant="button" numberOfLines={1} style={styles.url}>
              {url.replace('https://', '')}
            </Text>
          </Container>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Button
              onPress={onPublish}
              label={
                <FormattedMessage
                  defaultMessage="Ok!"
                  description="Publish modal publish button label"
                />
              }
              rightElement={
                <PremiumIndicator
                  isRequired={requiresSubscription && !isPremium}
                />
              }
              style={{ width: 200 }}
              loading={publishing}
            />
          </View>
        </View>
        <PressableNative
          onPress={onClose}
          disabled={publishing}
          style={styles.notPublishButton}
        >
          <Text style={styles.notPublishText}>
            <FormattedMessage
              defaultMessage="Hide my WebCard{azzappA} for the moment."
              description="Publish modal publish later button label"
              values={{
                azzappA: (
                  <Text variant="azzapp" style={styles.notPublishText}>
                    a
                  </Text>
                ),
              }}
            />
          </Text>
        </PressableNative>
      </Container>
    </ScreenModal>
  );
};

export default WebCardScreenPublishHelper;

const stylesheet = createStyleSheet(appearance => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  text: {
    textAlign: 'center',
  },
  buttonGroup: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingTop: 30,
  },
  urlContainer: {
    height: 25,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 22,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
    overflow: 'visible',
    ...shadow(appearance, 'bottom'),
  },
  url: {
    color: appearance === 'dark' ? colors.white : colors.black,
    marginLeft: 7,
  },
  iconLink: {
    tintColor: appearance === 'dark' ? colors.white : colors.black,
    height: 17,
    width: 17,
  },
  icon: {
    color: appearance === 'dark' ? colors.black : colors.white,
  },
  notPublishButton: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  notPublishText: {
    color: colors.grey200,
  },
  viewBottom: {
    height: 320,
    flex: 1,
    alignItems: 'center',
    gap: 20,
    paddingTop: 20,
  },
}));
