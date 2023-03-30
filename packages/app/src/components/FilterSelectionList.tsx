import { useState } from 'react';
import { useIntl } from 'react-intl';
import { ScrollView, StyleSheet, View, Text, Platform } from 'react-native';
import { colors, textStyles } from '#theme';
import PressableNative from '#ui/PressableNative';
import { EditableImage, useFilterList } from './medias';
import type { ImageEditionParameters } from '#helpers/mediaHelpers';
import type { EditableImageSource } from './medias';
import type { ScrollViewProps, LayoutChangeEvent } from 'react-native';

type FilterSelectionListProps = ScrollViewProps & {
  media: EditableImageSource;
  editionParameters: ImageEditionParameters;
  backgroundImageColor?: string | null;
  backgroundImageTintColor?: string | null;
  foregroundImageTintColor?: string | null;
  backgroundMultiply?: boolean | null;
  aspectRatio: number;
  selectedFilter: string | null;
  cardRadius?: number;
  onChange(value: string | null): void;
};

// TODO docs and tests once this component is production ready
const FilterSelectionList = ({
  media,
  editionParameters,
  aspectRatio,
  selectedFilter,
  backgroundImageColor,
  backgroundImageTintColor,
  foregroundImageTintColor,
  backgroundMultiply,
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
        media={media}
        editionParameters={editionParameters}
        backgroundImageColor={backgroundImageColor}
        backgroundImageTintColor={backgroundImageTintColor}
        foregroundImageTintColor={foregroundImageTintColor}
        backgroundMultiply={backgroundMultiply}
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
          media={media}
          editionParameters={editionParameters}
          backgroundImageColor={backgroundImageColor}
          backgroundImageTintColor={backgroundImageTintColor}
          foregroundImageTintColor={foregroundImageTintColor}
          backgroundMultiply={backgroundMultiply}
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
  media: EditableImageSource;
  editionParameters: ImageEditionParameters;
  backgroundImageColor?: string | null;
  backgroundImageTintColor?: string | null;
  foregroundImageTintColor?: string | null;
  backgroundMultiply?: boolean | null;
  aspectRatio: number;
  selected: boolean;
  filter: string | null;
  label: string;
  cardRadius: number;
  onPress(): void;
};

const FilterButton = ({
  media,
  editionParameters,
  backgroundImageColor,
  backgroundImageTintColor,
  foregroundImageTintColor,
  backgroundMultiply,
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
            borderColor: selected ? colors.black : 'transparent',
            borderRadius: borderRadius + BORDER_SELECTED_WIDTH,
          },
        ]}
      >
        <View style={[styles.wrapperEditableImage, { borderRadius }]}>
          <EditableImage
            source={media}
            backgroundImageColor={backgroundImageColor}
            backgroundImageTintColor={backgroundImageTintColor}
            foregroundImageTintColor={foregroundImageTintColor}
            backgroundMultiply={backgroundMultiply}
            editionParameters={editionParameters}
            filters={filter ? [filter] : null}
            style={[styles.filterImage, { aspectRatio, borderRadius }]}
          />
        </View>
      </View>
      <Text
        style={[
          textStyles.button,
          styles.filterTitle,
          selected && styles.filterTitleSelected,
        ]}
      >
        {label}
      </Text>
    </PressableNative>
  );
};

const BORDER_SELECTED_WIDTH = 3.75;

const styles = StyleSheet.create({
  wrapperEditableImage: {
    flex: 1,
    backgroundColor: colors.grey200,
  },
  filterButton: {
    marginEnd: 15 - 2 * BORDER_SELECTED_WIDTH,
    height: '100%',
  },
  filterImageContainer: {
    flex: 1,
    borderWidth: BORDER_SELECTED_WIDTH,
    shadowColor: colors.black,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    marginBottom: 10,
  },
  filterImage: {
    flex: 1,
    overflow: 'hidden',
  },
  filterTitle: {
    alignSelf: 'center',
    color: colors.grey200,
    marginBottom: 5,
  },
  filterTitleSelected: {
    alignSelf: 'center',
    color: colors.black,
  },
});
