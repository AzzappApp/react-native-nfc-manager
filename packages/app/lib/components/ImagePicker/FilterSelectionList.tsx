import { useIntl } from 'react-intl';
import { ScrollView, StyleSheet, View, Text, Platform } from 'react-native';
import { colors, textStyles } from '../../../theme';
import PressableNative from '../../ui/PressableNative';
import EditableImage from './EditableImage';
import { useFilterList } from './helpers';
import type { Media } from './helpers';
import type { ImageEditionParameters } from './mediaHelpers';
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
  const filters = useFilterList().filter(
    ({ ios, android }) =>
      (Platform.OS === 'ios' && ios) || (Platform.OS === 'android' && android),
  );
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
  <PressableNative onPress={onPress} style={styles.filterButton}>
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
  </PressableNative>
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
