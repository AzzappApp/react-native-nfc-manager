import {
  Suspense,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Platform, SectionList, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { type ArrayItemType } from '@azzapp/shared/arrayHelpers';
import { colors } from '#theme';
import Link from '#components/Link';
import { MediaImageRenderer } from '#components/medias';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { keyExtractor } from '#helpers/idHelpers';
import { profileInfoIsOwner } from '#helpers/profileRoleHelper';
import { useProfileInfos } from '#hooks/authStateHooks';
import { useFocusEffect } from '#hooks/useFocusEffect';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import LoadingView from '#ui/LoadingView';
import PressableNative from '#ui/PressableNative';
import RadioButton from '#ui/RadioButton';
import Text from '#ui/Text';
import Avatar, { AVATAR_WIDTH } from './Avatar';
import MultiUserPendingProfileOwner from './MultiUserPendingProfileOwner';
import { MultiUserTransferOwnerContext } from './MultiUserScreen';
import type {
  MultiUserScreenUserList_profiles$data,
  MultiUserScreenUserList_profiles$key,
} from '#relayArtifacts/MultiUserScreenUserList_profiles.graphql';
import type { MultiUserScreenUserList_webCard$key } from '#relayArtifacts/MultiUserScreenUserList_webCard.graphql';
import type { ListRenderItem, SectionListData } from 'react-native';

export type MultiUserScreenListProps = {
  webCard: MultiUserScreenUserList_webCard$key;
  Header: React.ReactElement;
  searching?: boolean;
  searchValue?: string;
};

const MultiUserScreenUserList = ({
  webCard: webCardKey,
  Header,
  searching,
  searchValue,
}: MultiUserScreenListProps) => {
  const intl = useIntl();

  const styles = useStyleSheet(styleSheet);

  const webCard = useFragment(
    graphql`
      fragment MultiUserScreenUserList_webCard on WebCard {
        id
        nbProfiles
        commonInformation {
          company
          addresses {
            address
          }
          emails {
            address
          }
          phoneNumbers {
            number
          }
          urls {
            address
          }
          socials {
            url
          }
        }
        logo {
          id
        }
        subscription {
          id
          subscriptionPlan
        }
        isPremium
        ...MultiUserScreenUserList_profiles
        ...MultiUserPendingProfileOwner
      }
    `,
    webCardKey,
  );

  // @TODO
  const nbCommonInformation =
    (webCard.commonInformation?.company ? 1 : 0) +
    (webCard.commonInformation?.addresses?.length ?? 0) +
    (webCard.commonInformation?.emails?.length ?? 0) +
    (webCard.commonInformation?.phoneNumbers?.length ?? 0) +
    (webCard.commonInformation?.urls?.length ?? 0) +
    (webCard.commonInformation?.socials?.length ?? 0) +
    (webCard.logo ? 1 : 0);

  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment MultiUserScreenUserList_profiles on WebCard
        @refetchable(
          queryName: "MultiUserScreenUserList_webCard_profiles_query"
        )
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 50 }
          search: { type: String }
          pixelRatio: {
            type: "Float!"
            provider: "CappedPixelRatio.relayprovider"
          }
        ) {
          profiles(search: $search, after: $after, first: $first)
            @connection(
              key: "MultiUserScreenUserList_webCard_connection_profiles"
            ) {
            edges {
              node {
                id
                profileRole
                contactCard {
                  firstName
                  lastName
                }
                user {
                  email
                  phoneNumber
                }
                avatar {
                  id
                  uri: uri(width: 112, pixelRatio: $pixelRatio)
                }
              }
            }
          }
        }
      `,
      webCard as MultiUserScreenUserList_profiles$key,
    );

  const sections = useMemo(() => {
    const result = (data.profiles.edges ?? []).reduce(
      (acc, curr) => {
        if (!curr?.node) {
          return acc;
        }
        const item = curr?.node;
        if (item) {
          const existingSection = acc.find(
            section => section.profileRole === item.profileRole,
          );
          if (existingSection) {
            existingSection.data.push(item);
          } else {
            console.error('No section found for profileRole', item.profileRole);
          }
        }

        return acc;
      },
      [
        {
          title: intl.formatMessage({
            defaultMessage: 'owner',
            description: 'MultiUserScreen - Owner role',
          }),
          profileRole: 'owner',
          data: [],
        },
        {
          title: intl.formatMessage({
            defaultMessage: 'admin',
            description: 'MultiUserScreen - Admin role',
          }),
          profileRole: 'admin',
          data: [],
        },
        {
          title: intl.formatMessage({
            defaultMessage: 'editor',
            description: 'MultiUserScreen - Editor role',
          }),
          profileRole: 'editor',
          data: [],
        },
        {
          title: intl.formatMessage({
            defaultMessage: 'user',
            description: 'MultiUserScreen - User role',
          }),
          profileRole: 'user',
          data: [],
        },
      ] as Array<{ title: string; profileRole: string; data: Profile[] }>,
    );

    return result
      .map(section => {
        if (section.data.length === 0) {
          return null;
        }
        return section;
      })
      .filter(section => section !== null);
  }, [data.profiles.edges, intl]);

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(50);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  //#region Search
  const [debounceText] = useDebounce(searchValue, 500);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    if (!isLoadingNext) {
      setRefreshing(true);
      refetch(
        { search: debounceText || undefined },
        { fetchPolicy: 'store-and-network' },
      );
      setRefreshing(false);
    }
  }, [debounceText, isLoadingNext, refetch]);

  useFocusEffect(onRefresh);

  const profileInfos = useProfileInfos();

  const { transferOwnerMode } = useContext(MultiUserTransferOwnerContext);

  const renderListItem = useCallback<ListRenderItem<Profile>>(
    ({ item }) => {
      if (
        item.id === profileInfos?.profileId &&
        webCard.nbProfiles > 1 &&
        profileInfoIsOwner(item)
      ) {
        return (
          <View>
            <UserListItem item={item} />
            {!searching && <MultiUserPendingProfileOwner webCard={webCard} />}
          </View>
        );
      }
      return <UserListItem item={item} />;
    },
    [profileInfos?.profileId, searching, webCard],
  );

  //filter the sections without having to reparse all the data
  const filteredSections = useMemo(() => {
    if (transferOwnerMode) {
      return sections.filter(section => section.profileRole !== 'owner');
    }
    return sections;
  }, [sections, transferOwnerMode]);

  useEffect(() => {
    refetch(
      { search: debounceText || undefined },
      { fetchPolicy: 'store-and-network' },
    );
  }, [debounceText, refetch]);
  //#endregion

  const { bottom } = useScreenInsets();

  const contentContainerStyle = useMemo(
    () => ({ paddingBottom: 40 + bottom }),
    [bottom],
  );

  const router = useRouter();

  return (
    <View style={styles.content}>
      <Suspense fallback={<LoadingView />}>
        <SectionList
          ListHeaderComponent={
            searching || searchValue ? null : (
              <View style={styles.headerContainer}>
                {Header}
                {!transferOwnerMode && (
                  <>
                    {webCard.isPremium && !webCard.subscription && (
                      <View style={styles.paymentMethod}>
                        <View>
                          <Text variant="button" appearance="dark">
                            <FormattedMessage
                              defaultMessage="No valid payment method"
                              description="Title for multi user screen when no valid payment method"
                            />
                          </Text>
                          <Text variant="small" appearance="dark">
                            <FormattedMessage
                              defaultMessage="Go to azzapp on the web to manage multi user option"
                              description="Description for multi user screen when no valid payment method"
                            />
                          </Text>
                        </View>
                        <Icon
                          icon="information"
                          size={14}
                          style={{ tintColor: 'white' }}
                        />
                      </View>
                    )}
                    <Button
                      style={styles.button}
                      label={intl.formatMessage({
                        defaultMessage: 'Add users',
                        description:
                          'Button to add new users from MultiUserScreen',
                      })}
                      onPress={() => {
                        if (webCard.isPremium && !webCard.subscription) {
                          Toast.show({
                            type: 'info',
                            text1: intl.formatMessage({
                              defaultMessage:
                                'Go to azzapp on the Web to manage multi-user',
                              description:
                                'Error message when trying to add a user without a valid payment method',
                            }),
                            props: {
                              showClose: true,
                            },
                          });
                          return;
                        }
                        router.push({
                          route: 'MULTI_USER_ADD',
                        });
                      }}
                    />
                    <Link route="COMMON_INFORMATION">
                      <Button
                        style={styles.button}
                        variant="secondary"
                        label={`${intl.formatMessage({
                          defaultMessage: 'Set common information',
                          description:
                            'Button to add common information to the contact card in MultiUserScreen',
                        })} (${nbCommonInformation})`}
                      />
                    </Link>
                  </>
                )}
              </View>
            )
          }
          accessibilityRole="list"
          sections={filteredSections}
          keyExtractor={keyExtractor}
          renderItem={renderListItem}
          renderSectionHeader={renderHeaderSection}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={contentContainerStyle}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="always"
        />
      </Suspense>
    </View>
  );
};

const renderHeaderSection = (info: {
  section: SectionListData<Profile, { title: string; data: Profile[] }>;
}) => {
  return <SectionHeader title={info.section.title} />;
};

// split the component from render function to use `useStyleSheet`
const SectionHeader = ({ title }: { title: string }) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <Container>
      <View style={styles.header}>
        <Text variant="xsmall" style={styles.headerText}>
          {title}
        </Text>
      </View>
    </Container>
  );
};

const ItemList = ({ item }: { item: Profile }) => {
  const styles = useStyleSheet(styleSheet);

  const profileInfos = useProfileInfos();
  const { transferOwnerMode, selectedProfileId, setSelectedProfileId } =
    useContext(MultiUserTransferOwnerContext);

  const router = useRouter();

  const onPressItem = useCallback(() => {
    if (transferOwnerMode) {
      setSelectedProfileId(item.id);
    } else {
      router.push({
        route: 'MULTI_USER_DETAIL',
        params: { profileId: item.id },
      });
    }
  }, [item.id, router, setSelectedProfileId, transferOwnerMode]);

  //#region Transfert ownership
  const onPressRadio = useCallback(() => {
    setSelectedProfileId(item.id);
  }, [item.id, setSelectedProfileId]);

  //#endregion

  const avatarSource = useMemo(() => {
    if (item.avatar?.uri) {
      return {
        uri: item.avatar.uri,
        mediaId: item.avatar.id ?? '',
        requestedSize: AVATAR_WIDTH,
      };
    }
    return null;
  }, [item.avatar]);

  if (!item || !item.contactCard) {
    return null;
  }
  const contactCard = item.contactCard;
  const isCurrentUser = item.id === profileInfos?.profileId;

  return (
    <Animated.View
      entering={FadeIn}
      exiting={Platform.OS === 'ios' ? undefined : FadeOut} // commented to fix crash: https://github.com/AzzappApp/azzapp/issues/6116
    >
      <PressableNative onPress={onPressItem} style={styles.user}>
        {avatarSource ? (
          <MediaImageRenderer source={avatarSource} style={styles.avatar} />
        ) : (
          <Avatar
            firstName={contactCard.firstName ?? ''}
            lastName={contactCard.lastName ?? ''}
          />
        )}
        <View style={styles.userInfos}>
          <Text variant="large">
            ~{contactCard.firstName ?? ''} {contactCard.lastName ?? ''}{' '}
            {isCurrentUser && (
              <FormattedMessage
                defaultMessage="(me)"
                description="MultiUserScreen - (me) suffix"
              />
            )}
          </Text>
          <Text style={styles.contact}>
            {item.user?.email ?? item.user?.phoneNumber}
          </Text>
        </View>
        {transferOwnerMode ? (
          <RadioButton
            checked={selectedProfileId === item.id}
            onChange={onPressRadio}
          />
        ) : (
          <Icon icon="arrow_right" />
        )}
      </PressableNative>
    </Animated.View>
  );
};

const UserListItem = memo(ItemList);

const styleSheet = createStyleSheet(appearance => ({
  headerContainer: { paddingBottom: 16, gap: 10 },
  content: {
    paddingTop: 10,
    width: '100%',
    flex: 1,
  },
  button: {
    width: '100%',
  },
  user: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfos: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 5,
    flex: 1,
  },
  contact: {
    color: colors.grey400,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  header: {
    backgroundColor: appearance === 'light' ? colors.grey100 : colors.grey800,
    borderRadius: 12,
    paddingVertical: 7,
    marginTop: 10,
    marginBottom: 5,
  },
  headerText: {
    color: appearance === 'light' ? colors.grey600 : colors.grey300,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  paymentMethod: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '100%',
    backgroundColor: colors.red400,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));

export default memo(MultiUserScreenUserList);

type Profile = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<MultiUserScreenUserList_profiles$data['profiles']['edges']>
    >
  >['node']
>;
