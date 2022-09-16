import { COVER_BASE_WIDTH } from '@azzapp/shared/lib/cardHelpers';
import { useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import CoverLink from './CoverLink';
import type {
  CoverList_users$data,
  CoverList_users$key,
} from '@azzapp/relay/artifacts/CoverList_users.graphql';
import type { ArrayItemType } from '@azzapp/shared/lib/arrayHelpers';
import type { ListRenderItemInfo, StyleProp, ViewStyle } from 'react-native';

type CoverListProps = {
  users: CoverList_users$key;
  canPlay?: boolean;
  onEndReached?: () => void;
  style?: StyleProp<ViewStyle>;
};

const CoverList = ({
  users: usersKey,
  canPlay = false,
  onEndReached,
  style,
}: CoverListProps) => {
  const users = useFragment(
    graphql`
      fragment CoverList_users on User @relay(plural: true) {
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

  const keyExtractor = useCallback(
    (item: ArrayItemType<CoverList_users$data>) => item.id,
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ArrayItemType<CoverList_users$data>>) => (
      <CoverLink
        cover={item.card?.cover}
        width={COVER_BASE_WIDTH}
        userName={item.userName}
        userId={item.id}
        style={styles.item}
        playTransition={canPlay}
        videoPaused={!canPlay}
      />
    ),
    [canPlay],
  );

  return (
    <FlatList
      data={users}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      horizontal
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={style}
    />
  );
};

export default CoverList;

const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingLeft: 10,
    flexGrow: 0,
  },
  item: {
    height: '100%',
    marginRight: 10,
    width: 125,
  },
});
