import Clipboard from '@react-native-clipboard/clipboard';
import { toGlobalId } from 'graphql-relay';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, ScrollView } from 'react-native';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
} from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import { colors, shadow } from '#theme';
import ContactCard from '#components/ContactCard';
import CoverRenderer from '#components/CoverRenderer';
import Link from '#components/Link';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { switchProfile } from '#helpers/MobileWebAPI';
import useAuthState from '#hooks/useAuthState';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { AccountScreenProfiles_userProfiles$key } from '@azzapp/relay/artifacts/AccountScreenProfiles_userProfiles.graphql';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';

type AccountScreenCoverProps = {
  userProfiles: AccountScreenProfiles_userProfiles$key;
};

const COVER_WIDTH = 135;

export default function AccountScreenProfiles({
  userProfiles: userProfilesKey,
}: AccountScreenCoverProps) {
  const carouselRef = useRef<ICarouselInstance>(null);
  const progressValue = useSharedValue<number>(0);

  const { profiles: userProfiles } = useFragment(
    graphql`
      fragment AccountScreenProfiles_userProfiles on User {
        profiles {
          id
          userName
          nbPosts
          nbFollowings
          nbFollowers
          card {
            backgroundColor
            cover {
              ...CoverRenderer_cover
            }
          }
          contactCard {
            ...ContactCard_card
          }
        }
      }
    `,
    userProfilesKey,
  );

  const profiles = useMemo(() => {
    return ['new', ...(userProfiles ?? [])];
  }, [userProfiles]);

  const auth = useAuthState();

  const authId = toGlobalId('Profile', auth.profileId ?? '');

  const currentAuthId = useRef(authId);

  const [index, setIndex] = useState(
    Math.max(userProfiles?.findIndex(p => p.id === authId) ?? 0, 0),
  );

  useAnimatedReaction(
    () => {
      return progressValue.value;
    },
    (result, previous) => {
      if (
        Math.floor(result) !== Math.floor(previous ?? 0) &&
        Math.floor(result) > 0
      ) {
        runOnJS(setIndex)(Math.floor(result) - 1);
      }
    },
    [],
  );

  const currentProfile = userProfiles?.[index];

  const [debouncedCurrentProfileId] = useDebounce(currentProfile?.id, 800);

  useEffect(() => {
    if (
      debouncedCurrentProfileId &&
      authId !== debouncedCurrentProfileId &&
      authId === currentAuthId.current
    ) {
      switchProfile({ profileId: debouncedCurrentProfileId })
        .then(response => {
          currentAuthId.current = toGlobalId('Profile', response.profileId);
          return dispatchGlobalEvent({
            type: 'PROFILE_CHANGE',
            payload: {
              profileId: response.profileId,
              authTokens: {
                token: response.token,
                refreshToken: response.refreshToken,
              },
            },
          });
        })
        .catch(err => {
          // TODO : handle error correctly / display message to user
          console.error('error while switching profile', err);
        });
    }
  }, [authId, debouncedCurrentProfileId]);

  useEffect(() => {
    if (authId !== currentAuthId.current) {
      const index = Math.max(
        userProfiles?.findIndex(p => p.id === authId) ?? 0,
        0,
      );
      if (index > 0) {
        carouselRef.current?.scrollTo({
          index: index + 1,
          animated: false,
        });
        currentAuthId.current = authId;
      }
    }
  }, [authId, userProfiles]);

  const router = useRouter();
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={styles.carouselContainer}>
        <View style={{ alignSelf: 'center' }}>
          <Carousel
            ref={carouselRef}
            height={230}
            width={COVER_WIDTH}
            style={{
              width: COVER_WIDTH * 3,
              justifyContent: 'center',
              height: 235,
              overflow: 'visible',
            }}
            mode="parallax"
            windowSize={4}
            snapEnabled
            loop={false}
            data={profiles}
            modeConfig={{
              parallaxScrollingScale: 1,
              parallaxAdjacentItemScale: 0.5,
              parallaxScrollingOffset: 25,
            }}
            onProgressChange={(_, absoluteProgress) => {
              progressValue.value = absoluteProgress;
            }}
            defaultIndex={Math.min(index + 1, profiles.length - 1)}
            renderItem={({ item }) =>
              typeof item === 'string' ? (
                <PressableNative
                  accessibilityRole="link"
                  accessibilityLabel={intl.formatMessage({
                    defaultMessage: 'Create a new profile',
                    description:
                      'Start new profile creation from account screen',
                  })}
                  onPress={() => {
                    router.push({
                      route: 'NEW_PROFILE',
                      params: {
                        goBack: true,
                      },
                    });
                  }}
                >
                  <View style={styles.addContainer}>
                    <Icon icon="add" style={styles.icon} />
                  </View>
                </PressableNative>
              ) : (
                <View style={[styles.coverContainer]}>
                  <CoverRenderer
                    width={COVER_WIDTH}
                    key={item.id}
                    userName={item.userName}
                    cover={item.card?.cover}
                    style={
                      item.card?.backgroundColor != null && {
                        backgroundColor: item.card?.backgroundColor,
                      }
                    }
                  />
                </View>
              )
            }
          />
        </View>
      </View>
      <View style={styles.countersContainer}>
        <Link
          route="PROFILE"
          params={{
            userName: currentProfile?.userName ?? '',
            showPosts: true,
          }}
        >
          <PressableNative style={styles.counterContainer}>
            <Text variant="xlarge">{currentProfile?.nbPosts}</Text>
            <Text variant="small" style={styles.counterValue} numberOfLines={1}>
              <FormattedMessage
                defaultMessage="Posts"
                description="Number of posts"
              />
            </Text>
          </PressableNative>
        </Link>
        <Link route="FOLLOWERS">
          <PressableNative style={styles.counterContainer}>
            <Text variant="xlarge">{currentProfile?.nbFollowers}</Text>
            <Text variant="small" style={styles.counterValue} numberOfLines={1}>
              <FormattedMessage
                defaultMessage="Followers"
                description="Number of followers"
              />
            </Text>
          </PressableNative>
        </Link>
        <Link route="FOLLOWINGS">
          <PressableNative style={styles.counterContainer}>
            <Text variant="xlarge">{currentProfile?.nbFollowings}</Text>
            <Text variant="small" style={styles.counterValue} numberOfLines={1}>
              <FormattedMessage
                defaultMessage="Followings"
                description="Number of followed profiles"
              />
            </Text>
          </PressableNative>
        </Link>
      </View>
      <ScrollView>
        <View
          style={[
            styles.profileDataContainer,
            { paddingBottom: insets.bottom + 700 },
          ]}
        >
          <PressableNative
            accessibilityRole="button"
            onPress={() =>
              Clipboard.setString(buildUserUrl(currentProfile?.userName ?? ''))
            }
          >
            <View style={styles.profileUrlContainer}>
              <Text
                variant="medium"
                style={styles.profileUrl}
                numberOfLines={1}
              >
                {buildUserUrl(currentProfile?.userName ?? '')}
              </Text>
            </View>
          </PressableNative>
          <Link route="CONTACT_CARD">
            <PressableNative>
              {
                /* Contact card may be missing when profile is optimistically added in the cache. */
                currentProfile?.contactCard ? (
                  <ContactCard
                    userName={currentProfile.userName}
                    contactCard={currentProfile.contactCard}
                  />
                ) : null
              }
            </PressableNative>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}

const styleSheet = createStyleSheet(appearance => ({
  carouselContainer: {
    paddingTop: 14,
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
  },
  coverContainer: [
    {
      backgroundColor: appearance === 'dark' ? colors.black : colors.white,
      borderRadius: 18,
    },
    shadow(appearance, 'center'),
  ],
  addContainer: {
    borderColor: colors.grey200,
    borderWidth: 2,
    borderRadius: 16,
    borderStyle: 'dashed',
    width: COVER_WIDTH,
    height: 216,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    tintColor: colors.grey200,
    width: 32,
    height: 32,
  },
  countersContainer: {
    flexDirection: 'row',
    columnGap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: colors.grey100,
  },
  counterContainer: { width: 12, alignItems: 'center', flex: 1 },
  counterValue: {
    color: colors.grey400,
  },
  profileDataContainer: {
    maxWidth: 355,
    padding: 20,
    alignSelf: 'center',
    alignItems: 'center',
    width: '100%',
    rowGap: 10,
  },
  profileUrlContainer: [
    {
      height: 52,
      width: '100%',
      paddingLeft: 10,
      paddingRight: 20,
      borderRadius: 12,
      backgroundColor: appearance === 'dark' ? colors.black : colors.white,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    shadow(appearance),
  ],
  profileUrl: {
    flex: 1,
  },
  arrowIcon: {
    tintColor: appearance === 'dark' ? colors.white : colors.black,
  },
  webCardContainer: [
    {
      backgroundColor: colors.black,
      paddingVertical: 20,
      paddingHorizontal: 26,
      borderRadius: 13,
      width: '100%',
      aspectRatio: 1.6,
    },
    shadow(appearance),
  ],
  webCardBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
    bottom: 0,
    borderRadius: 13,
  },
  webCardBackgroundImage: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  webCardContent: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 2,
    flexDirection: 'row',
    gap: 10,
  },
  webCardLabel: { color: colors.white },
  webCardFooter: { flex: 1, justifyContent: 'flex-end' },
  webCardInfos: { flex: 1 },
}));
