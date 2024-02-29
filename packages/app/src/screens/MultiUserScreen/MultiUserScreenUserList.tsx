import {
  Suspense,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { ActivityIndicator, SectionList, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import {
  convertToNonNullArray,
  type ArrayItemType,
} from '@azzapp/shared/arrayHelpers';
import { isOwner } from '@azzapp/shared/profileHelpers';
import { colors } from '#theme';
import { MEDIA_WIDTH } from '#components/AuthorCartouche';
import { MediaImageRenderer } from '#components/medias';
import { useRouter } from '#components/NativeRouter';
import ScreenModal from '#components/ScreenModal';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useAuthState from '#hooks/useAuthState';
import { useFocusEffect } from '#hooks/useFocusEffect';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import RadioButton from '#ui/RadioButton';
import SearchBar from '#ui/SearchBar';
import Text from '#ui/Text';
import Avatar from './Avatar';
import MultiUserDetailModal from './MultiUserDetailModal';
import MultiUserPendingProfileOwner from './MultiUserPendingProfileOwner';
import { MultiUserTransferOwnerContext } from './MultiUserScreen';
import type { MultiUserDetailModal_Profile$key } from '#relayArtifacts/MultiUserDetailModal_Profile.graphql';
import type {
  MultiUserScreenUserList_profiles$data,
  MultiUserScreenUserList_profiles$key,
} from '#relayArtifacts/MultiUserScreenUserList_profiles.graphql';
import type { MultiUserScreenUserList_webCard$key } from '#relayArtifacts/MultiUserScreenUserList_webCard.graphql';
import type { MultiUserScreenUserListItem_Profile$key } from '#relayArtifacts/MultiUserScreenUserListItem_Profile.graphql';
import type { ListRenderItem, SectionListData } from 'react-native';

export type MultiUserScreenListProps = {
  webCard: MultiUserScreenUserList_webCard$key;
  toggleCommonInfosForm: () => void;
  Header: React.ReactElement;
};

const MultiUserScreenUserList = ({
  webCard: webCardKey,
  toggleCommonInfosForm,
  Header,
}: MultiUserScreenListProps) => {
  const intl = useIntl();
  const router = useRouter();
  const styles = useStyleSheet(styleSheet);

  const webCard = useFragment(
    graphql`
      fragment MultiUserScreenUserList_webCard on WebCard {
        id
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
        ...MultiUserDetailModal_webCard
        ...MultiUserScreenUserList_profiles
        ...MultiUserPendingProfileOwner
      }
    `,
    webCardKey,
  );

  // @TODO
  const nbCommonInformation =
    (webCard.commonInformation?.company ? 1 : 0) +
    (webCard.commonInformation?.addresses?.some(a => a.address) ? 1 : 0) +
    (webCard.commonInformation?.emails?.some(a => a.address) ? 1 : 0) +
    (webCard.commonInformation?.phoneNumbers?.some(p => p.number) ? 1 : 0) +
    (webCard.commonInformation?.urls?.some(u => u.address) ? 1 : 0) +
    (webCard.commonInformation?.socials?.some(s => s.url) ? 1 : 0);

  const onAddUsers = useCallback(() => {
    router.push({ route: 'MULTI_USER_ADD' });
  }, [router]);

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
        ) {
          profiles(search: $search, after: $after, first: $first)
            @connection(
              key: "MultiUserScreenUserList_webCard_connection_profiles"
            ) {
            edges {
              node {
                id
                profileRole
                ...MultiUserScreenUserListItem_Profile
                ...MultiUserDetailModal_Profile
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
            section => section.title === item.profileRole,
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
        { title: 'owner', data: [] },
        { title: 'admin', data: [] },
        { title: 'editor', data: [] },
        { title: 'user', data: [] },
      ] as Array<{ title: string; data: Profile[] }>,
    );
    return convertToNonNullArray(
      result.map(section => {
        if (section.data.length === 0) {
          return null;
        }
        return section;
      }),
    );
  }, [data.profiles.edges]);

  const [selectedProfile, setSelectedProfile] = useState<
    MultiUserDetailModal_Profile$key | undefined
  >();

  const closeModal = useCallback(() => setSelectedProfile(undefined), []);

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(50);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    if (!isLoadingNext) {
      setRefreshing(true);
      refetch({}, { fetchPolicy: 'store-and-network' });
      setRefreshing(false);
    }
  }, [isLoadingNext, refetch]);

  useFocusEffect(onRefresh);

  const { profileInfos } = useAuthState();

  const isWebCardOwner = useMemo(
    () => isOwner(profileInfos?.profileRole),
    [profileInfos?.profileRole],
  );

  const { transferOwnerMode } = useContext(MultiUserTransferOwnerContext);

  const renderListItem = useCallback<ListRenderItem<Profile>>(
    ({ item }) => {
      if (isWebCardOwner && item.id === profileInfos?.profileId) {
        return (
          <View>
            <UserListItem profileKey={item} onPress={setSelectedProfile} />
            <MultiUserPendingProfileOwner webCard={webCard} />
          </View>
        );
      }
      return <UserListItem profileKey={item} onPress={setSelectedProfile} />;
    },
    [isWebCardOwner, profileInfos?.profileId, webCard],
  );

  //filter the sections without having to reparse all the data
  const filteredSections = useMemo(() => {
    if (transferOwnerMode) {
      return sections.filter(section => section.title !== 'owner');
    }
    return sections;
  }, [sections, transferOwnerMode]);

  //#region Search
  const [searchValue, setSearchValue] = useState<string | undefined>('');
  const [debounceText] = useDebounce(searchValue, 500);

  useEffect(() => {
    refetch({ search: debounceText }, { fetchPolicy: 'store-and-network' });
  }, [debounceText, refetch]);
  //#endregion

  const ListHeaderComponent = useMemo(() => {
    return (
      <View style={styles.headerContainer}>
        {Header}
        {!transferOwnerMode && (
          <>
            <Button
              style={styles.button}
              label={intl.formatMessage({
                defaultMessage: 'Add users',
                description: 'Button to add new users from MultiUserScreen',
              })}
              onPress={onAddUsers}
            />
            <Button
              style={styles.button}
              variant="secondary"
              label={`${intl.formatMessage({
                defaultMessage: 'Set common information',
                description:
                  'Button to add common information to the contact card in MultiUserScreen',
              })} (${nbCommonInformation})`}
              onPress={toggleCommonInfosForm}
            />
          </>
        )}
      </View>
    );
  }, [
    Header,
    intl,
    nbCommonInformation,
    onAddUsers,
    styles.button,
    styles.headerContainer,
    toggleCommonInfosForm,
    transferOwnerMode,
  ]);

  const { bottom } = useSafeAreaInsets();
  return (
    <View style={styles.content}>
      <SearchBar
        placeholder={intl.formatMessage({
          defaultMessage: 'Search for a user',
          description: 'MultiScreen - search bar placeholder',
        })}
        onChangeText={setSearchValue}
        value={searchValue}
      />
      <Suspense
        fallback={
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator />
          </View>
        }
      >
        <SectionList
          ListHeaderComponent={ListHeaderComponent}
          accessibilityRole="list"
          sections={filteredSections}
          keyExtractor={sectionKeyExtractor}
          renderItem={renderListItem}
          renderSectionHeader={renderHeaderSection}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingBottom: 40 + bottom }}
          onEndReachedThreshold={0.5}
        />
      </Suspense>
      <ScreenModal visible={Boolean(selectedProfile)} animationType="slide">
        <MultiUserDetailModal
          webCard={webCard}
          profile={selectedProfile}
          onClose={closeModal}
        />
      </ScreenModal>
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

const ItemList = ({
  onPress,
  profileKey,
}: {
  onPress: (
    profile: MultiUserDetailModal_Profile$key &
      MultiUserScreenUserListItem_Profile$key,
  ) => void;
  profileKey: MultiUserDetailModal_Profile$key &
    MultiUserScreenUserListItem_Profile$key;
  selectProfile?: (profileId: string) => void;
}) => {
  const styles = useStyleSheet(styleSheet);
  const data = useFragment(
    graphql`
      fragment MultiUserScreenUserListItem_Profile on Profile
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
      ) {
        id
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
    `,
    profileKey as MultiUserDetailModal_Profile$key,
  );
  const { profileInfos } = useAuthState();
  const { transferOwnerMode, selectedProfileId, setSelectedProfileId } =
    useContext(MultiUserTransferOwnerContext);

  const onPressItem = useCallback(() => {
    if (transferOwnerMode) {
      setSelectedProfileId(data.id);
    } else {
      onPress(profileKey);
    }
  }, [data.id, onPress, profileKey, setSelectedProfileId, transferOwnerMode]);

  //#region Transfert ownership
  const onPressRadio = useCallback(() => {
    setSelectedProfileId(data.id);
  }, [data.id, setSelectedProfileId]);

  //#endregion

  if (!data || !data.contactCard) {
    return null;
  }
  const contactCard = data.contactCard;
  const isCurrentUser = data.id === profileInfos?.profileId;

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <PressableNative onPress={onPressItem} style={styles.user}>
        {data.avatar ? (
          <MediaImageRenderer
            source={{
              uri: data.avatar.uri,
              mediaId: data.avatar.id ?? '',
              requestedSize: MEDIA_WIDTH,
            }}
            style={styles.avatar}
          />
        ) : (
          <Avatar
            firstName={contactCard.firstName ?? ''}
            lastName={contactCard.lastName ?? ''}
          />
        )}
        <View style={styles.userInfos}>
          <Text variant="large">
            ~{contactCard.firstName ?? ''} {contactCard.lastName ?? ''}{' '}
            {isCurrentUser && '(me)'}
          </Text>
          <Text style={styles.contact}>
            {data.user.email ?? data.user.phoneNumber}
          </Text>
        </View>
        {transferOwnerMode ? (
          <RadioButton
            checked={selectedProfileId === data.id}
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

const sectionKeyExtractor = (item: { id: string }) => {
  return item.id;
};
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
}));

export default memo(MultiUserScreenUserList);

type Profile = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<MultiUserScreenUserList_profiles$data['profiles']['edges']>
    >
  >['node']
>;
