import { useCallback, useMemo, useRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { COVER_BASE_WIDTH } from '@azzapp/shared/coverHelpers';
import CoverLink from './CoverLink';
import type {
  CoverList_users$data,
  CoverList_users$key,
} from '@azzapp/relay/artifacts/CoverList_users.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo, StyleProp, ViewStyle } from 'react-native';

type CoverListProps = {
  users: CoverList_users$key;
  onEndReached?: () => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  coverStyle?: StyleProp<ViewStyle>;
  horizontal?: boolean;
  numColums?: number;
  onReady?: () => void;
  initialNumToRender?: number;
  ListHeaderComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;
};
// TODO docs and tests once this component is production ready
const CoverList = ({
  users: usersKey,
  onEndReached,
  style,
  coverStyle = {},
  containerStyle,
  horizontal = true,
  numColums = 1,
  initialNumToRender = 5,
  onReady,
  ListHeaderComponent,
}: CoverListProps) => {
  const coverWidth = useMemo(() => {
    //TODO: refactoring aka do it better :). number is required. flatten will give a string.
    // not elegant but works
    const flatStyles = StyleSheet.flatten(coverStyle);
    if (typeof flatStyles?.width === 'number') {
      return flatStyles.width;
    }
    return COVER_BASE_WIDTH;
  }, [coverStyle]);

  const users = useFragment(
    graphql`
      fragment CoverList_users on Profile @relay(plural: true) {
        id
        userName
        card {
          backgroundColor
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

  const coversReady = useRef(0);
  const onCoverReady = useCallback(() => {
    coversReady.current++;
    if (
      coversReady.current >= initialNumToRender ||
      coversReady.current === users.length
    ) {
      onReady?.();
    }
  }, [initialNumToRender, onReady, users.length]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ArrayItemType<CoverList_users$data>>) => (
      <CoverLink
        cover={item.card?.cover}
        width={coverWidth}
        userName={item.userName}
        profileID={item.id}
        style={[
          styles.item,
          { height: horizontal ? '100%' : 'auto' },
          item.card?.backgroundColor != null && {
            backgroundColor: item.card?.backgroundColor,
          },
          coverStyle,
        ]}
        onReadyForDisplay={onCoverReady}
      />
    ),
    [coverStyle, coverWidth, horizontal, onCoverReady],
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
      testID="cover-list"
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
      ListHeaderComponent={ListHeaderComponent}
      initialNumToRender={initialNumToRender}
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
