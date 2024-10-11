import { FlashList } from '@shopify/flash-list';
import { memo, useCallback, useMemo } from 'react';
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
import type { ListRenderItemInfo } from '@shopify/flash-list';
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

  const renderItem = useCallback(
    (param: ListRenderItemInfo<ArrayItemType<CoverList_users$data>>) => {
      if (customRenderItem) {
        return customRenderItem(param);
      }
      const { item } = param;
      return (
        <CoverListItem
          webCard={item}
          withShadow={withShadow}
          coverWidth={coverWidth}
        />
      );
    },
    //those parameter will not change  from props, don't require to be in extraData for rerender
    [coverWidth, customRenderItem, withShadow],
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
      extraData={extraData}
    />
  );
};

const OverflowScrollView = ({ style, ...rest }: ScrollViewProps) => (
  <ScrollView {...rest} style={[style, scrollViewStyle.overflowScrollView]} />
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
}: {
  webCard: ArrayItemType<CoverList_users$data>;
  coverWidth: number;
  withShadow: boolean;
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
      <CoverLink webCard={webCard} width={coverWidth} webCardId={webCard.id} />
    </Container>
  );
};
const CoverListItem = memo(ItemList);
