import { useIntl } from 'react-intl';
import { Pressable, ScrollView, StyleSheet, View, Text } from 'react-native';
import { colors, textStyles } from '../../../theme';
import EditableImage from './EditableImage';
import type { ImageEditionParameters, Media } from './helpers';
import type { ScrollViewProps } from 'react-native';

type FilterSelectionListProps = ScrollViewProps & {
  media: Media;
  editionParameters: ImageEditionParameters;
  aspectRatio: number;
  selectedFilter: string | null;
  onChange(value: string | null): void;
};

const FilterSelectionList = ({
  media,
  editionParameters,
  aspectRatio,
  selectedFilter,
  onChange,
  ...props
}: FilterSelectionListProps) => {
  const intl = useIntl();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} {...props}>
      <FilterButton
        media={media}
        editionParameters={editionParameters}
        aspectRatio={aspectRatio}
        selected={selectedFilter === null}
        label={intl.formatMessage({
          defaultMessage: 'Normal',
          description:
            'Name of the default filter (no filter applied) in image edition',
        })}
        filter={null}
        onPress={() => onChange(null)}
      />
      {filters.map(({ filter, label }) => (
        <FilterButton
          key={filter}
          media={media}
          editionParameters={editionParameters}
          aspectRatio={aspectRatio}
          selected={filter === selectedFilter}
          label={label}
          filter={filter}
          onPress={() => onChange(filter)}
        />
      ))}
    </ScrollView>
  );
};

export default FilterSelectionList;

type FilterButtonProps = {
  media: Media;
  editionParameters: ImageEditionParameters;
  aspectRatio: number;
  selected: boolean;
  filter: string | null;
  label: string;
  onPress(): void;
};

const FilterButton = ({
  media,
  editionParameters,
  aspectRatio,
  selected,
  label,
  filter,
  onPress,
}: FilterButtonProps) => (
  <Pressable
    style={({ pressed }) => [styles.filterButton, pressed && { opacity: 0.8 }]}
    onPress={onPress}
  >
    <View style={styles.filterImageContainer}>
      <Text
        style={[
          textStyles.button,
          styles.filterTitle,
          selected && styles.filterTitleSelected,
        ]}
      >
        {label}
      </Text>
      <EditableImage
        source={media}
        editionParameters={editionParameters}
        filters={filter ? [filter] : null}
        style={[styles.filterImage, { aspectRatio }]}
      />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  filterButton: {
    marginEnd: 10,
    height: '100%',
  },
  filterImageContainer: {
    flex: 1,
  },
  filterImage: {
    flex: 1,
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

const filters = [
  { filter: 'chrome', label: 'Chrome' },
  { filter: 'fade', label: 'Fade' },
  { filter: 'instant', label: 'Instant' },
  { filter: 'noir', label: 'Noir' },
  { filter: 'process', label: 'Process' },
  { filter: 'tonal', label: 'Tonal' },
  { filter: 'transfer', label: 'Transfer' },
  { filter: 'sepia', label: 'Sepia' },
  { filter: 'thermal', label: 'Thermal' },
  { filter: 'xray', label: 'X-ray' },
];
