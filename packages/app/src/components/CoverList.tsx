import { FlashList } from '@shopify/flash-list';
import { forwardRef, memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Container from '#ui/Container';
import CoverLink from './CoverLink';
import type {
  CoverList_users$data,
  CoverList_users$key,
} from '#relayArtifacts/CoverList_users.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { ListRenderItemInfo, ViewToken } from '@shopify/flash-list';
import type { ForwardedRef } from 'react';
import type { ScrollViewProps } from 'react-native';

// Base props that are common to both cases
type CoverListProps = {
  users: CoverList_users$key;
  coverWidth: number;
  renderItem?: (
    param: ListRenderItemInfo<ArrayItemType<CoverList_users$data>>,
  ) => JSX.Element | null;
  onEndReached?: () => void;
  horizontal?: boolean;
  numColums?: number;
  ListHeaderComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;
  onRefresh?: () => void;
  refreshing?: boolean;
  withShadow?: boolean;
  gap?: number; // flashlist don't handle gap on containerStyle
  extraData?: any; //any is taken from flashlistProps
  maxCoverPlay?: number;
};

const CoverList = ({
  users: usersKey,
  onEndReached,
  coverWidth = COVER_BASE_WIDTH,
  withShadow = false,
  horizontal = true,
  numColums = 1,
  ListHeaderComponent,
  renderItem: customRenderItem,
  refreshing,
  onRefresh,
  gap = 10,
  extraData,
  maxCoverPlay = 2,
}: CoverListProps) => {
  const users = useFragment(
    graphql`
      fragment CoverList_users on WebCard @relay(plural: true) {
        id
        userName
        ...CoverLink_webCard
      }
    `,
    usersKey,
  );

  const [viewableItems, setViewableItems] = useState<number[]>([]);

  const renderItem = useCallback(
    (param: ListRenderItemInfo<ArrayItemType<CoverList_users$data>>) => {
      if (customRenderItem) {
        return customRenderItem(param);
      }
      const { item, index, extraData } = param;
      const shouldPlay = extraData.viewableItems.some((v: any) => v === index);
      return (
        <CoverListItem
          webCard={item}
          withShadow={withShadow}
          coverWidth={coverWidth}
          shouldPlayMedia={shouldPlay}
        />
      );
    },
    //those parameter will not change  from props, don't require to be in extraData for rerender
    [coverWidth, customRenderItem, withShadow],
  );

  //# region viewable to handle video preview
  const onViewableItemChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      //we can only have two Item
      const viewableRows = info.viewableItems
        .filter(item => item != null && item.isViewable)
        .map(item => item.index!)
        .slice(0, maxCoverPlay);

      // This is a basic implementation and might need adjustments
      if (viewableRows.length >= 1) {
        setViewableItems(viewableRows);
      } else {
        setViewableItems([]);
      }
    },
    [maxCoverPlay],
  );

  return (
    <FlashList
      testID="cover-list"
      accessibilityRole="list"
      data={users}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      estimatedItemSize={coverWidth}
      onEndReached={onEndReached}
      horizontal={horizontal}
      numColumns={horizontal ? 1 : numColums}
      showsHorizontalScrollIndicator={false}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListHeaderComponent={ListHeaderComponent}
      onViewableItemsChanged={onViewableItemChanged}
      ItemSeparatorComponent={props => (
        <ItemSeparatorComponent {...props} gap={gap} horizontal={horizontal} />
      )}
      renderScrollComponent={OverflowScrollView}
      contentInset={{
        top: horizontal ? 0 : gap,
        left: horizontal ? gap : 0,
        bottom: 0,
        right: 0,
      }}
      onEndReachedThreshold={0.3}
      extraData={{ ...extraData, viewableItems }}
      viewabilityConfig={viewabilityConfig}
    />
  );
};

const viewabilityConfig = {
  itemVisiblePercentThreshold: 89,
};

// eslint-disable-next-line react/display-name
const OverflowScrollView = forwardRef(
  ({ style, ...rest }: ScrollViewProps, ref: ForwardedRef<ScrollView>) => (
    <ScrollView
      ref={ref}
      {...rest}
      style={[style, scrollViewStyle.overflowScrollView]}
    />
  ),
);

const ItemSeparatorComponent = ({
  gap,
  horizontal,
}: {
  gap: number;
  horizontal: boolean;
}) => (
  <View style={{ width: horizontal ? gap : 0, height: horizontal ? 0 : gap }} />
);

const keyExtractor = (item: ArrayItemType<CoverList_users$data>) => item.id;

export default memo(CoverList);

const styleSheet = createStyleSheet(appearance => ({
  coverContainerStyle: {
    ...shadow(appearance, 'center'),
  },
}));

const scrollViewStyle = StyleSheet.create({
  overflowScrollView: { overflow: 'visible' },
});

const ItemList = ({
  webCard,
  withShadow,
  coverWidth,
  shouldPlayMedia = false,
}: {
  webCard: ArrayItemType<CoverList_users$data>;
  coverWidth: number;
  withShadow: boolean;
  shouldPlayMedia?: boolean;
}) => {
  const styles = useStyleSheet(styleSheet);

  const itemStyle = useMemo(() => {
    if (withShadow) {
      return {
        ...styles.coverContainerStyle,
        borderRadius: COVER_CARD_RADIUS * coverWidth,
        width: coverWidth,
        aspectRatio: COVER_RATIO,
      };
    }
    return {
      width: coverWidth,
      aspectRatio: COVER_RATIO,
    };
  }, [coverWidth, styles.coverContainerStyle, withShadow]);
  return (
    <Container style={itemStyle}>
      <CoverLink
        webCard={webCard}
        width={coverWidth}
        webCardId={webCard.id}
        canPlay={shouldPlayMedia}
      />
    </Container>
  );
};
const CoverListItem = memo(ItemList);
