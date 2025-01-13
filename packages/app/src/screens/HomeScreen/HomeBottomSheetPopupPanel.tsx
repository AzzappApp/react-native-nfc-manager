import { ResizeMode, Video } from 'expo-av';
import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useColorScheme, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  fetchQuery,
  graphql,
  useFragment,
  useMutation,
  useRelayEnvironment,
} from 'react-relay';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import BottomSheetPopup from '#components/popup/BottomSheetPopup';
import { PopupButton } from '#components/popup/PopupElements';
import { getAuthState, onChangeWebCard } from '#helpers/authStore';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import BottomSheetTextInput from '#ui/BottomSheetTextInput';
import Icon from '#ui/Icon';
import { PageProgress } from '#ui/PageProgress';
import Text from '#ui/Text';
import { useHomeBottomSheetModalToolTipContext } from './HomeBottomSheetModalToolTip';
import type { HomeBottomSheetPopupPanel_profile$key } from '#relayArtifacts/HomeBottomSheetPopupPanel_profile.graphql';
import type { HomeBottomSheetPopupPanelCheckUserNameQuery } from '#relayArtifacts/HomeBottomSheetPopupPanelCheckUserNameQuery.graphql';
import type { HomeBottomSheetPopupPanelGetProposedUsernameQuery } from '#relayArtifacts/HomeBottomSheetPopupPanelGetProposedUsernameQuery.graphql';
import type { ReactNode } from 'react';

type HomeBottomSheetPopupPanelProps = {
  profile: HomeBottomSheetPopupPanel_profile$key | null;
  pausePolling: () => void;
  resumePolling: () => void;
};

const animationDuration = 500;

const HomeBottomSheetPopupPanel = ({
  profile: profileKey,
  pausePolling,
  resumePolling,
}: HomeBottomSheetPopupPanelProps) => {
  const profile = useFragment(
    graphql`
      fragment HomeBottomSheetPopupPanel_profile on Profile {
        id
        webCard {
          id
          userName
        }
      }
    `,
    profileKey ?? null,
  );

  const intl = useIntl();
  const environment = useRelayEnvironment();
  const styles = useStyleSheet(stylesheet);

  useEffect(() => {
    if (!profile?.webCard?.userName) {
      pausePolling();
    }
    return resumePolling;
  }, [pausePolling, profile?.webCard?.userName, resumePolling]);

  useEffect(() => {
    const fct = async () => {
      if (profile?.webCard && !profile?.webCard?.userName) {
        const res =
          await fetchQuery<HomeBottomSheetPopupPanelGetProposedUsernameQuery>(
            environment,
            graphql`
              query HomeBottomSheetPopupPanelGetProposedUsernameQuery(
                $webcardId: String!
              ) {
                getProposedUserName(webcardId: $webcardId)
              }
            `,
            { webcardId: profile.webCard.id },
          ).toPromise();
        if (res?.getProposedUserName) {
          setNewUserName(res.getProposedUserName);
        }
      }
    };
    if (profile?.webCard) fct();
  }, [environment, profile?.webCard]);

  const [commitUserName] = useMutation(graphql`
    mutation HomeBottomSheetPopupPanelMutation(
      $webCardId: ID!
      $input: UpdateWebCardInput!
    ) {
      updateWebCard(webCardId: $webCardId, input: $input) {
        webCard {
          id
          userName
        }
      }
    }
  `);

  const [currentPage, setCurrentPage] = useState(0);
  const [newUserName, setNewUserName] = useState('');
  const [error, setError] = useState<ReactNode[] | string | undefined>(
    undefined,
  );

  const visible = profile?.webCard && !profile.webCard.userName;

  const resetPopupState = useCallback(() => {
    setCurrentPage(0);
    setError(undefined);
    setNewUserName('');
  }, []);

  const onLinkUrlChanged = (url: string) => {
    setNewUserName(url);
    validateUrl(url);
  };

  const userNameAlreadyExistsError = intl.formatMessage(
    {
      defaultMessage: 'This WebCard{azzappA} name is already registered',
      description: 'NewProfileScreen - Username already taken error',
    },
    {
      azzappA: <Text variant="azzapp">a</Text>,
    },
  ) as unknown as string;

  const userNameInvalidError = intl.formatMessage(
    {
      defaultMessage:
        'WebCard{azzappA} name can not contain space or special characters',
      description: 'NewProfileScreen - Username Error',
    },
    {
      azzappA: <Text variant="azzapp">a</Text>,
    },
  );

  const validateUrl = useCallback(
    async (userName: string) => {
      if (userName) {
        if (!isValidUserName(userName)) {
          setError(userNameInvalidError);
          return;
        }
        try {
          const res =
            await fetchQuery<HomeBottomSheetPopupPanelCheckUserNameQuery>(
              environment,
              graphql`
                query HomeBottomSheetPopupPanelCheckUserNameQuery(
                  $userName: String!
                ) {
                  isUserNameAvailable(userName: $userName) {
                    available
                    userName
                  }
                }
              `,
              { userName },
            ).toPromise();

          if (res?.isUserNameAvailable.userName !== userName) {
            // ignore result
            return;
          }
          if (res?.isUserNameAvailable.available) {
            setError(undefined);
          } else {
            setError(userNameAlreadyExistsError);
          }
        } catch {
          //waiting for submit
          setError(undefined);
        }
      }
    },
    [environment, userNameAlreadyExistsError, userNameInvalidError],
  );

  const { setTooltipedWebcard } = useHomeBottomSheetModalToolTipContext();

  const onNextPageRequested = useCallback(() => {
    if (currentPage < 2) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
    }
    if (currentPage === 2) {
      if (!isValidUserName(newUserName)) {
        setError(userNameInvalidError);
      } else {
        commitUserName({
          variables: {
            webCardId: profile?.webCard?.id,
            input: {
              userName: newUserName,
            },
          },
          onCompleted: () => {
            const tooltipWebcardId = profile?.webCard?.id;

            const profileInfo = getAuthState().profileInfos;
            if (profileInfo) {
              onChangeWebCard({ ...profileInfo, webCardUserName: newUserName });
            }

            setTimeout(() => {
              if (tooltipWebcardId) {
                setTooltipedWebcard(tooltipWebcardId);
              }
            }, 500);
          },
          updater: store => {
            // reorder carousel once userName is set
            if (!profile?.webCard?.id) return;
            const currentWebCard = store.get(profile.webCard?.id);
            currentWebCard?.setValue(newUserName, 'userName');

            const root = store.getRoot();
            const user = root.getLinkedRecord('currentUser');
            const profiles = user?.getLinkedRecords('profiles');
            if (!profiles) {
              return;
            }
            user?.setLinkedRecords(
              profiles?.sort((a, b) => {
                const webCardA = a.getLinkedRecord('webCard');
                const webCardB = b.getLinkedRecord('webCard');

                return (
                  (webCardA?.getValue('userName') as string) ?? ''
                ).localeCompare(
                  (webCardB?.getValue('userName') as string) ?? '',
                );
              }),
              'profiles',
            );
            root.setLinkedRecord(user, 'currentUser');
          },
          onError: e => {
            console.error('fail to configure username', e);
          },
        });
      }
    }
  }, [
    commitUserName,
    currentPage,
    newUserName,
    profile?.webCard?.id,
    setTooltipedWebcard,
    userNameInvalidError,
  ]);

  const colorScheme = useColorScheme();

  return (
    <BottomSheetPopup
      animationDuration={animationDuration}
      visible={!!visible}
      onFadeOutFinish={resetPopupState}
      isAnimatedContent
    >
      <View style={styles.container}>
        <View>
          {/* Page 0 */}
          {currentPage === 0 && (
            <Animated.View
              style={styles.page}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Video
                style={styles.illustration}
                isLooping
                shouldPlay
                isMuted
                resizeMode={ResizeMode.COVER}
                source={
                  colorScheme === 'dark'
                    ? require('#assets/hint_1_dark_ae.mp4')
                    : require('#assets/hint_1_light_ae.mp4')
                }
              />
              <Text variant="large" style={styles.descriptionTextContainer}>
                <FormattedMessage
                  defaultMessage="Congratulations!
Your contactCard is ready
to be shared!"
                  description="Congratulation label after sucessfull contact card creation"
                />
              </Text>
              <Text variant="medium" style={styles.descriptionTextContainer}>
                <FormattedMessage
                  defaultMessage="Use the bottom menu to easily share your contact information"
                  description="Congratulation label after sucessfull contact card creation"
                />
              </Text>
            </Animated.View>
          )}
          {/* Page 1 */}
          {currentPage === 1 && (
            <Animated.View
              style={styles.page}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Video
                style={styles.illustration}
                isLooping
                shouldPlay
                isMuted
                resizeMode={ResizeMode.COVER}
                source={
                  colorScheme === 'dark'
                    ? require('#assets/hint_2_dark_ae.mp4')
                    : require('#assets/hint_2_light_ae.mp4')
                }
              />
              <Text variant="large" style={styles.descriptionTextContainer}>
                <FormattedMessage
                  defaultMessage="Instantly share your ContactCard information with the “Shake & Share”!"
                  description="Congratulation label after sucessfull contact card creation"
                />
              </Text>
              <Text variant="medium" style={styles.descriptionTextContainer}>
                <FormattedMessage
                  defaultMessage="Shake your phone to instantly share your contact information."
                  description="Congratulation label after sucessfull contact card creation"
                />
              </Text>
            </Animated.View>
          )}

          {/* Page 2 */}
          {currentPage === 2 && (
            <Animated.View
              style={styles.page}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <Text variant="large" style={styles.topDescriptionTextContainer}>
                <FormattedMessage
                  defaultMessage="Choose your azzapp url"
                  description="Congratulation label after sucessfull contact card creation"
                />
              </Text>
              <Text variant="medium" style={styles.descriptionTextContainer}>
                <FormattedMessage
                  defaultMessage="Every card comes with a short Website. Claim your free azzapp url, you can modify it later"
                  description="Congratulation label after sucessfull contact card creation"
                />
              </Text>
              <View style={styles.linkInput}>
                <BottomSheetTextInput
                  defaultValue={newUserName}
                  onChangeText={onLinkUrlChanged}
                  autoCapitalize="none"
                  autoCorrect={false}
                  isErrored={!!error}
                  onEndEditing={onNextPageRequested}
                  returnKeyType="done"
                />
                {/* keeping an empty <text> avoid bottom text to jump */}
                <Text variant="error">{error || ' '}</Text>
              </View>
              <View style={styles.urlContainer}>
                <Icon
                  icon={error ? 'closeFull' : 'check_filled'}
                  style={{
                    tintColor: error ? colors.red400 : colors.green,
                  }}
                />

                <Text
                  variant="medium"
                  style={[styles.urlText, error && styles.errorStyle]}
                >
                  {`azzapp.com/${newUserName}`}
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
        <View style={styles.progress}>
          <PageProgress nbPages={3} currentPage={currentPage} />
        </View>
        <View style={styles.buttonContainer}>
          <PopupButton
            disabled={!!error}
            onPress={onNextPageRequested}
            text={
              currentPage === 2
                ? intl.formatMessage({
                    defaultMessage: 'OK',
                    description:
                      'Congratulation label after sucessfull contact card creation',
                  })
                : intl.formatMessage({
                    defaultMessage: 'Next',
                    description:
                      'Congratulation label after sucessfull contact card creation',
                  })
            }
          />
        </View>
      </View>
    </BottomSheetPopup>
  );
};

const stylesheet = createStyleSheet(theme => ({
  container: {
    backgroundColor: theme === 'dark' ? colors.grey900 : colors.white,
    width: 295,
    borderRadius: 20,
    alignSelf: 'center',
    padding: 20,
  },
  descriptionTextContainer: {
    color: theme === 'dark' ? colors.white : colors.black,
    paddingTop: 20,
    textAlign: 'center',
  },
  topDescriptionTextContainer: {
    color: theme === 'dark' ? colors.white : colors.black,
    textAlign: 'center',
  },
  illustration: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  page: { width: '100%' },
  progress: {
    paddingVertical: 10,
    height: 25,
    alignSelf: 'center',
  },
  linkInput: { paddingVertical: 20 },
  urlText: {
    marginLeft: 5,
  },
  urlContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 20,
  },
  errorStyle: { color: colors.red400 },
  buttonContainer: {
    paddingTop: 14,
  },
}));

export default HomeBottomSheetPopupPanel;
