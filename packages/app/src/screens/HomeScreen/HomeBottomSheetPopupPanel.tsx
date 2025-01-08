import { ResizeMode, Video } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useColorScheme, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  fetchQuery,
  graphql,
  useMutation,
  useRelayEnvironment,
} from 'react-relay';
import { isValidUserName } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import BottomSheetPopup from '#components/popup/BottomSheetPopup';
import { PopupButton } from '#components/popup/PopupElements';
import { onChangeWebCard, type ProfileInfos } from '#helpers/authStore';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useKeyboardHeight from '#hooks/useKeyboardHeight';
import Icon from '#ui/Icon';
import { PageProgress } from '#ui/PageProgress';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import { useHomeBottomSheetModalToolTipContext } from './HomeBottomSheetModalToolTip';
import type { HomeBottomSheetPopupPanelCheckUserNameQuery } from '#relayArtifacts/HomeBottomSheetPopupPanelCheckUserNameQuery.graphql';
import type { HomeBottomSheetPopupPanelGetProposedUsernameQuery } from '#relayArtifacts/HomeBottomSheetPopupPanelGetProposedUsernameQuery.graphql';
import type { ReactNode } from 'react';

type HomeBottomSheetPopupPanelProps = {
  /**
   *
   *
   * @type {boolean}
   */
  profileInfo?: Pick<
    ProfileInfos,
    'invited' | 'profileId' | 'profileRole' | 'webCardId'
  >;
  refreshQuery?: () => void;
};

const animationDuration = 500;

const HomeBottomSheetPopupPanel = ({
  profileInfo,
  refreshQuery,
}: HomeBottomSheetPopupPanelProps) => {
  const intl = useIntl();
  const environment = useRelayEnvironment();
  const styles = useStyleSheet(stylesheet);

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (profileInfo) {
      timeoutRef.current = setTimeout(() => {
        onChangeWebCard(profileInfo);
      }, 2000);
      return () => clearTimeout(timeoutRef.current);
    }
  }, [profileInfo]);

  useEffect(() => {
    const fct = async () => {
      if (!profileInfo?.webCardId) return;
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
          { webcardId: profileInfo?.webCardId },
        ).toPromise();
      if (res?.getProposedUserName) {
        setLocalUrl(res.getProposedUserName);
      }
    };
    if (profileInfo?.webCardId) fct();
  }, [environment, profileInfo?.webCardId]);

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
  const currentPageSharedValue = useSharedValue(0);
  const [localUrl, setLocalUrl] = useState('');
  const [error, setError] = useState<ReactNode[] | string | undefined>(
    undefined,
  );

  const visible = profileInfo?.webCardId !== undefined;

  const resetPopupState = useCallback(() => {
    setCurrentPage(0);
    setError(undefined);
    setLocalUrl('');
  }, []);

  const resetPopupStateWl = useCallback(() => {
    'worklet';
    currentPageSharedValue.value = 0;
    runOnJS(resetPopupState)();
  }, [currentPageSharedValue, resetPopupState]);

  const opacityForPage = (pageIndex: number) => {
    'worklet';
    const opacity = withTiming(
      currentPageSharedValue.value === pageIndex ? 1 : 0,
      {
        duration: animationDuration,
      },
    );
    return { opacity };
  };

  const animatedStylePage0 = useAnimatedStyle(() => {
    return opacityForPage(0);
  });

  const animatedStylePage1 = useAnimatedStyle(() => {
    return opacityForPage(1);
  });

  const animatedStylePage2 = useAnimatedStyle(() => {
    return opacityForPage(2);
  });

  const onLinkUrlChanged = (url: string) => {
    setLocalUrl(url);
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
      currentPageSharedValue.value = nextPage;
      setCurrentPage(nextPage);
    }
    if (currentPage === 2) {
      commitUserName({
        variables: {
          webCardId: profileInfo?.webCardId,
          input: {
            userName: localUrl,
          },
        },
        onCompleted: () => {
          refreshQuery?.();

          const tooltipWebcardId = profileInfo?.webCardId;

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            onChangeWebCard(profileInfo);
          }
          setTimeout(() => {
            if (tooltipWebcardId) {
              setTooltipedWebcard(tooltipWebcardId);
            }
          }, 500);
        },
        updater: store => {
          // reorder carousel once userName is set
          if (!profileInfo?.webCardId) return;
          const currentWebCard = store.get(profileInfo.webCardId);
          currentWebCard?.setValue(localUrl, 'userName');

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
              ).localeCompare((webCardB?.getValue('userName') as string) ?? '');
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
  }, [
    commitUserName,
    currentPage,
    currentPageSharedValue,
    localUrl,
    profileInfo,
    refreshQuery,
    setTooltipedWebcard,
  ]);

  const keyboardHeight = useKeyboardHeight();

  const containerHeight = useAnimatedStyle(() => {
    if (currentPage === 2) {
      return {
        height: withTiming(353, { duration: 500 }),
        transform: [
          {
            translateY: -keyboardHeight.value / 2,
          },
        ],
      };
    } else {
      return { height: 458 };
    }
  });
  const colorScheme = useColorScheme();

  return (
    <BottomSheetPopup
      animationDuration={animationDuration}
      visible={visible}
      onFadeOutFinish={resetPopupStateWl}
      isAnimatedContent
    >
      <Animated.View style={[styles.container, containerHeight]}>
        <View style={styles.pageContainer}>
          {/* Page 0 */}
          <Animated.View style={[animatedStylePage0, styles.page]}>
            {currentPage === 0 ? (
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
            ) : undefined}
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
          {/* Page 1 */}
          <Animated.View style={[animatedStylePage1, styles.page]}>
            {currentPage === 1 ? (
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
            ) : undefined}
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

          {/* Page 2 */}
          <Animated.View style={[animatedStylePage2, styles.page]}>
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
              <TextInput
                defaultValue={localUrl}
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
                {`azzapp.com/${localUrl}`}
              </Text>
            </View>
          </Animated.View>
        </View>
        <View style={styles.progress}>
          <PageProgress nbPages={3} currentPage={currentPage} />
        </View>
        <View style={styles.buttonContainer}>
          <PopupButton
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
      </Animated.View>
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
  pageContainer: { flex: 1 },
  page: { top: 0, position: 'absolute', width: '100%' },
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
