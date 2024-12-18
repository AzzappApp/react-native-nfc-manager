import { memo, useCallback } from 'react';
import { SectionList } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Text from '#ui/Text';
import Container from './Container';
import PressableNative from './PressableNative';
import type {
  SectionListData,
  StyleProp,
  ViewStyle,
  ListRenderItemInfo,
  SectionListProps,
} from 'react-native';

export type SelectSectionListProps<ItemT, SectionT> = Omit<
  SectionListProps<ItemT, SectionT>,
  'children' | 'keyExtractor' | 'renderItem'
> &
  SelectSectionListItemCommonProps<ItemT> & {
    /**
     * Used to extract a unique key for a given item at the specified index. Key is used for caching
     * and as the react key to track item re-ordering. The default extractor checks `item.key`, then
     * falls back to using the index, like React does.
     */
    keyExtractor: (item: ItemT, index: number) => string;

    /**
     * The selected item key
     */
    selectedItemKey?: string | null | undefined;
  };

/**
 * A component that display a list of items to an user and allow him to select one of them
 */
function SelectSectionList<ItemT, SectionT>({
  sections,
  selectedItemKey,
  onItemSelected,
  keyExtractor,
  labelField = 'title' as keyof ItemT,
  renderItem,
  renderSectionHeader,
  itemContainerStyle,
  selectedItemContainerStyle,
  ...props
}: SelectSectionListProps<ItemT, SectionT>) {
  const styles = useStyleSheet(styleSheet);
  const renderListItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ItemT>) => {
      const isSelected = keyExtractor(item, index) === selectedItemKey;

      return (
        <MemoSelectSectionListItem
          selectedItemContainerStyle={selectedItemContainerStyle}
          renderItem={renderItem}
          isSelected={isSelected}
          onItemSelected={onItemSelected}
          itemContainerStyle={itemContainerStyle}
          item={item}
          index={index}
          labelField={labelField}
        />
      );
    },
    [
      keyExtractor,
      selectedItemKey,
      selectedItemContainerStyle,
      renderItem,
      onItemSelected,
      itemContainerStyle,
      labelField,
    ],
  );

  const renderHeaderSection = useCallback(
    (info: { section: SectionListData<ItemT, SectionT> }) => {
      if (renderSectionHeader) {
        return renderSectionHeader(info as any);
      } else {
        return (
          <Container style={styles.sectionTitleContainer}>
            <Text variant="xsmall" style={styles.titleSection}>
              {(info.section as any)[labelField]}
            </Text>
          </Container>
        );
      }
    },
    [labelField, renderSectionHeader, styles],
  );
  return (
    <SectionList
      accessibilityRole="list"
      sections={sections}
      keyExtractor={keyExtractor}
      renderItem={renderListItem}
      renderSectionHeader={renderHeaderSection}
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
}

export default SelectSectionList;

type SelectSectionListItemCommonProps<ItemT> = {
  /**
   * Callback called when an item is selected
   */
  onItemSelected: (item: ItemT) => void;

  /**
   * Render the item in the list
   */
  renderItem?: (
    itemInfo: SelectSectionListItemInfo<ItemT>,
  ) => React.ReactElement | null;

  /**
   * Style of the item container
   */
  itemContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Style of the item container when it is selected
   */
  selectedItemContainerStyle?: StyleProp<ViewStyle>;

  /* label field used for the default item renderer, default to 'label'
   */
  labelField?: keyof ItemT;
};

export type SelectSectionListItemInfo<ItemT> = {
  /**
   * The item to render
   */
  item: ItemT;
  /**
   * The index of the item in the list
   */
  index: number;
  /**
   * Whether the item is the selected one
   */
  isSelected: boolean;
};

type SelectSectionListItemProps<ItemT> =
  SelectSectionListItemCommonProps<ItemT> & SelectSectionListItemInfo<ItemT>;

function SelectSectionListItem<ItemT>({
  isSelected,
  selectedItemContainerStyle,
  itemContainerStyle,
  renderItem,
  onItemSelected,
  item,
  index,
  labelField,
}: SelectSectionListItemProps<ItemT>) {
  const onPress = useCallback(() => {
    onItemSelected(item);
  }, [item, onItemSelected]);

  const styles = useStyleSheet(styleSheet);

  return (
    <PressableNative
      style={[
        itemContainerStyle,
        styles.itemContainer,
        isSelected &&
          (selectedItemContainerStyle ?? styles.selectedItemContainer),
      ]}
      onPress={onPress}
      hitSlop={{
        top: 10,
        bottom: 10,
      }}
    >
      {renderItem?.({ item, isSelected, index }) ?? (
        <Text
          variant={isSelected ? 'button' : 'medium'}
          style={styles.defaultItemRenderer}
        >
          {(item as any)?.[labelField]}
        </Text>
      )}
    </PressableNative>
  );
}

const MemoSelectSectionListItem = memo(
  SelectSectionListItem,
) as unknown as typeof SelectSectionListItem;

const styleSheet = createStyleSheet(appearance => ({
  defaultItemRenderer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedItemContainer: {
    justifyContent: 'center',
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
    borderRadius: 5,
    height: 32,
  },
  itemContainer: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  sectionTitleContainer: {
    backgroundColor: appearance === 'light' ? colors.grey100 : colors.grey800,
    height: 28,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    color: appearance === 'light' ? colors.grey600 : colors.grey300,
  },
}));
