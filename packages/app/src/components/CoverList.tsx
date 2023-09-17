import { useCallback, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
} from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
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
  columnWrapperStyle?: StyleProp<ViewStyle>;
  horizontal?: boolean;
  numColums?: number;
  onReady?: () => void;
  initialNumToRender?: number;
  ListHeaderComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;
  renderItem?: (
    info: ListRenderItemInfo<ArrayItemType<CoverList_users$data>>,
  ) => React.ReactElement | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  withShadow?: boolean;
};
// TODO docs and tests once this component is production ready
const CoverList = ({
  users: usersKey,
  onEndReached,
  style,
  coverStyle = {},
  containerStyle,
  withShadow,
  horizontal = true,
  numColums = 1,
  initialNumToRender = 5,
  onReady,
  ListHeaderComponent,
  renderItem: customRenderItem,
  columnWrapperStyle,
  refreshing,
  onRefresh,
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
        ...CoverLink_profile
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

  const styles = useStyleSheet(styleSheet);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ArrayItemType<CoverList_users$data>>) => (
      <View
        style={
          withShadow
            ? {
                ...styles.coverContainerStyle,
                borderRadius: COVER_CARD_RADIUS * coverWidth,
              }
            : null
        }
      >
        <CoverLink
          profile={item}
          width={coverWidth}
          profileId={item.id}
          style={coverStyle}
          onReadyForDisplay={onCoverReady}
        />
      </View>
    ),
    [
      coverStyle,
      coverWidth,
      onCoverReady,
      styles.coverContainerStyle,
      withShadow,
    ],
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
      renderItem={customRenderItem ?? renderItem}
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
      columnWrapperStyle={columnWrapperStyle}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
};

export default CoverList;

const styleSheet = createStyleSheet(appearance => ({
  container: {
    flexGrow: 0,
    gap: 5,
  },
  coverContainerStyle: {
    ...shadow(appearance, 'center'),
    backgroundColor: appearance === 'dark' ? colors.black : colors.white,
  },
}));
