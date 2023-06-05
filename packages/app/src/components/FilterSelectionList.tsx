import { useState } from 'react';
import { useIntl } from 'react-intl';
import { ScrollView, View, Platform } from 'react-native';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import { GPUImageView, useFilterList } from './gpu';
import type { ImageLayer, VideoFrameLayer } from './gpu';
import type { ScrollViewProps, LayoutChangeEvent } from 'react-native';

type FilterSelectionListProps = ScrollViewProps & {
  layer: ImageLayer | VideoFrameLayer;
  aspectRatio: number;
  selectedFilter: string | null;
  cardRadius?: number;
  onChange(value: string | null): void;
};

// TODO docs and tests once this component is production ready
const FilterSelectionList = ({
  layer,
  aspectRatio,
  selectedFilter,
  cardRadius = 0,
  onChange,
  ...props
}: FilterSelectionListProps) => {
  const intl = useIntl();
  const filters = useFilterList().filter(
    ({ ios, android }) =>
      (Platform.OS === 'ios' && ios) || (Platform.OS === 'android' && android),
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} {...props}>
      <FilterButton
        layer={layer}
        aspectRatio={aspectRatio}
        selected={selectedFilter === null}
        label={intl.formatMessage({
          defaultMessage: 'Normal',
          description:
            'Name of the default filter (no filter applied) in image edition',
        })}
        filter={null}
        cardRadius={cardRadius}
        onPress={() => onChange(null)}
      />
      {filters.map(({ filter, label }) => (
        <FilterButton
          key={filter}
          layer={layer}
          aspectRatio={aspectRatio}
          selected={filter === selectedFilter}
          label={label}
          filter={filter}
          cardRadius={cardRadius}
          onPress={() => onChange(filter)}
        />
      ))}
    </ScrollView>
  );
};

export default FilterSelectionList;
type FilterButtonProps = {
  layer: ImageLayer | VideoFrameLayer;
  aspectRatio: number;
  selected: boolean;
  filter: string | null;
  label: string;
  cardRadius: number;
  onPress(): void;
};

const FilterButton = ({
  layer,
  aspectRatio,
  selected,
  label,
  filter,
  cardRadius,

  onPress,
}: FilterButtonProps) => {
  const [width, setWidth] = useState<number | null>(null);
  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const borderRadius = Platform.select({
    web: cardRadius ? (`${cardRadius}%` as any) : null,
    default: width != null && cardRadius != null ? cardRadius * width : null,
  });

  const styles = useStyleSheet(styleSheet);
  return (
    <PressableNative
      onPress={onPress}
      style={[styles.filterButton]}
      onLayout={onLayout}
    >
      <View
        style={[
          styles.filterImageContainer,
          {
            borderRadius: borderRadius + BORDER_SELECTED_WIDTH,
            borderColor: 'transparent',
          },
          selected && styles.selected,
        ]}
      >
        <View style={[styles.imageWrapper, { borderRadius }]}>
          <GPUImageView
            style={[styles.filterImage, { aspectRatio, borderRadius }]}
            layers={[{ ...layer, filters: filter ? [filter] : [] }]}
          />
        </View>
      </View>
      <Text
        variant="small"
        style={[styles.filterTitle, selected && styles.filterTitleSelected]}
      >
        {label}
      </Text>
    </PressableNative>
  );
};

const BORDER_SELECTED_WIDTH = 3.75;

const styleSheet = createStyleSheet(appearance => ({
  imageWrapper: {
    flex: 1,
    backgroundColor: colors.grey200,
  },
  filterButton: {
    marginEnd: 15 - 2 * BORDER_SELECTED_WIDTH,
    height: '90%',
  },
  filterImageContainer: [
    {
      flex: 1,
      borderWidth: BORDER_SELECTED_WIDTH,
    },
    shadow(appearance, 'center'),
  ],
  selected: {
    borderColor: appearance === 'light' ? colors.black : colors.white,
  },
  filterImage: {
    flex: 1,
    overflow: 'hidden',
  },
  filterTitle: {
    alignSelf: 'center',
  },
  filterTitleSelected: {
    alignSelf: 'center',
  },
}));
