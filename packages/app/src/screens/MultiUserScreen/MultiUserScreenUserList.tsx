import { memo, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import {
  convertToNonNullArray,
  type ArrayItemType,
} from '@azzapp/shared/arrayHelpers';
import { colors } from '#theme';
import { MEDIA_WIDTH } from '#components/AuthorCartouche';
import { MediaImageRenderer } from '#components/medias';
import { useRouter } from '#components/NativeRouter';
import useAuthState from '#hooks/useAuthState';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import Avatar from './Avatar';
import MultiUserDetailModal from './MultiUserDetailModal';
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

  const webCard = useFragment(
    graphql`
      fragment MultiUserScreenUserList_webCard on WebCard {
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

  const onAddUsers = () => {
    router.push({ route: 'MULTI_USER_ADD' });
  };

  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment MultiUserScreenUserList_profiles on WebCard
        @refetchable(
          queryName: "MultiUserScreenUserList_webCard_profiles_query"
        )
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 100 }
        ) {
          profiles(after: $after, first: $first)
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
      loadNext(100);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  const onRefresh = useCallback(() => {
    if (!isLoadingNext) {
      refetch({}, { fetchPolicy: 'store-and-network' });
    }
  }, [isLoadingNext, refetch]);

  const renderListItem = useCallback<ListRenderItem<Profile>>(({ item }) => {
    return <UserListItem profileKey={item} onPress={setSelectedProfile} />;
  }, []);

  const { bottom } = useSafeAreaInsets();
  return (
    <View style={styles.content}>
      <SectionList
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            {Header}
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
          </View>
        }
        accessibilityRole="list"
        sections={sections}
        keyExtractor={sectionKeyExtractor}
        renderItem={renderListItem}
        renderSectionHeader={renderHeaderSection}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        refreshing={isLoadingNext}
        onRefresh={onRefresh}
        contentContainerStyle={{ paddingBottom: 40 + bottom }}
        onEndReachedThreshold={0.5}
      />

      <MultiUserDetailModal
        webCard={webCard}
        profile={selectedProfile}
        onClose={closeModal}
      />
    </View>
  );
};

const renderHeaderSection = (info: {
  section: SectionListData<Profile, { title: string; data: Profile[] }>;
}) => {
  return (
    <View style={styles.header}>
      <Text variant="xsmall" style={styles.headerText}>
        {info.section.title}
      </Text>
    </View>
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
}) => {
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
          uri: uri(width: 56, pixelRatio: $pixelRatio)
        }
      }
    `,
    profileKey as MultiUserDetailModal_Profile$key,
  );
  const { profileInfos } = useAuthState();

  const onPressItem = useCallback(() => {
    onPress(profileKey);
  }, [onPress, profileKey]);

  if (!data || !data.contactCard) {
    return null;
  }
  const contactCard = data.contactCard;
  const isCurrentUser = data.id === profileInfos?.profileId;

  return (
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
        <Text style={[styles.contact]}>
          {data.user.email ?? data.user.phoneNumber}
        </Text>
      </View>
      <Icon icon="arrow_right" />
    </PressableNative>
  );
};

const UserListItem = memo(ItemList);

const sectionKeyExtractor = (item: { id: string }) => {
  return item.id;
};

const styles = StyleSheet.create({
  content: {
    paddingTop: 10,
    width: '100%',
  },
  button: {
    width: '100%',
    marginTop: 10,
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
    backgroundColor: colors.grey100,
    borderRadius: 12,
    paddingVertical: 7,
    marginTop: 10,
  },
  headerText: {
    color: colors.grey600,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

export default MultiUserScreenUserList;

type Profile = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<MultiUserScreenUserList_profiles$data['profiles']['edges']>
    >
  >['node']
>;
