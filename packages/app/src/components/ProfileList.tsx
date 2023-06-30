import { memo, useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeOutUp } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import SearchBar from '#ui/SearchBar';
import Text from '#ui/Text';
import CoverRenderer from './CoverRenderer';
import Link from './Link';
import type {
  ProfileList_users$data,
  ProfileList_users$key,
} from '@azzapp/relay/artifacts/ProfileList_users.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { StyleProp, ViewStyle } from 'react-native';

const ProfileListItemMemoized = memo(function ProfileListItem({
  profile,
  onToggleFollow,
}: {
  onToggleFollow?: (id: string) => void;
  profile: ArrayItemType<ProfileList_users$data>;
}) {
  return (
    <Animated.View style={styles.item} exiting={FadeOutUp}>
      <Link
        route="PROFILE"
        params={{ userName: profile.userName, profileID: profile.id }}
      >
        <PressableNative style={styles.profile}>
          <CoverRenderer
            cover={profile.card?.cover}
            width={COVER_WIDTH}
            userName={profile.userName}
            videoEnabled={false}
          />
          <Text variant="large" numberOfLines={1}>
            {profile.userName}
          </Text>
        </PressableNative>
      </Link>
      {onToggleFollow ? (
        <IconButton
          icon="delete"
          size={35}
          style={styles.deleteIcon}
          onPress={() => onToggleFollow(profile.id)}
        />
      ) : null}
    </Animated.View>
  );
});

type ProfileListProps = {
  users: ProfileList_users$key;
  onEndReached?: () => void;
  style?: StyleProp<ViewStyle>;
  onToggleFollow?: (id: string) => void;
  noProfileFoundLabel: string;
  searchValue: string | undefined;
  setSearchValue: (value: string | undefined) => void;
};

const COVER_WIDTH = 35;
const COVER_HEIGHT = 56;

const SEPARATOR_HEIGHT = 10.5;

const getItemLayout = (_data: any, index: number) => ({
  length: COVER_HEIGHT,
  offset: COVER_HEIGHT * index + SEPARATOR_HEIGHT * (index - 1),
  index,
});

const keyExtractor = (item: ArrayItemType<ProfileList_users$data>) => item.id;

const ProfileList = ({
  users: usersKey,
  onEndReached,
  style,
  onToggleFollow,
  noProfileFoundLabel,
  searchValue,
  setSearchValue,
}: ProfileListProps) => {
  const users = useFragment(
    graphql`
      fragment ProfileList_users on Profile @relay(plural: true) {
        id
        userName
        card {
          cover {
            ...CoverRenderer_cover
          }
        }
      }
    `,
    usersKey,
  );

  const renderItem = useCallback(
    ({ item }: { item: ArrayItemType<ProfileList_users$data> }) => (
      <ProfileListItemMemoized profile={item} onToggleFollow={onToggleFollow} />
    ),
    [onToggleFollow],
  );

  return (
    <FlatList
      testID="profile-list"
      accessibilityRole="list"
      data={users}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={style}
      getItemLayout={getItemLayout}
      ListHeaderComponent={
        <View style={styles.header}>
          <SearchBar onChangeText={setSearchValue} value={searchValue} />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text variant="medium">{noProfileFoundLabel}</Text>
        </View>
      }
    />
  );
};

export default ProfileList;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    rowGap: SEPARATOR_HEIGHT,
  },
  header: { paddingHorizontal: 10 },
  item: {
    paddingRight: 10,
    columnGap: 15.5,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  profile: {
    paddingLeft: 20.5,
    columnGap: 15.5,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deleteIcon: {
    marginLeft: 'auto',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
