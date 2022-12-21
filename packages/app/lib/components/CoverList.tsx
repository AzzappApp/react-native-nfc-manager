import { COVER_BASE_WIDTH } from '@azzapp/shared/lib/cardHelpers';
import { useCallback, useMemo } from 'react';
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
  containerStyle?: StyleProp<ViewStyle>;
  coverStyle?: StyleProp<ViewStyle>;
  horizontal?: boolean;
  numColums?: number;
};

const CoverList = ({
  users: usersKey,
  canPlay = false,
  onEndReached,
  style,
  coverStyle = {},
  containerStyle,
  horizontal = true,
  numColums = 1,
}: CoverListProps) => {
  const coverWidth = useMemo(() => {
    //TODO: refactoring aka do it better :). number is required. flatten will give a string.
    // not elegant but works
    const flattenStyle = StyleSheet.flatten(coverStyle);
    if (typeof flattenStyle?.width === 'number') {
      return flattenStyle.width;
    }
    return COVER_BASE_WIDTH;
  }, [coverStyle]);
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
        width={coverWidth}
        userName={item.userName}
        userId={item.id}
        style={[
          styles.item,
          { height: horizontal ? '100%' : 'auto' },
          coverStyle,
        ]}
        playTransition={canPlay}
        videoDisabled={!canPlay}
      />
    ),
    [canPlay, coverStyle, coverWidth, horizontal],
  );

  //TODO: handle vertical layout with height instead of width
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: coverWidth,
      offset: coverWidth * index,
      index,
    }),
    [coverWidth],
  );

  return (
    <FlatList
      accessibilityRole="list"
      data={users}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      horizontal={horizontal}
      numColumns={horizontal ? 1 : numColums}
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, containerStyle]}
      style={style}
      getItemLayout={getItemLayout}
    />
  );
};

export default CoverList;

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  item: {
    height: '100%',
    marginRight: 10,
    width: 125,
  },
});
