import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import { useFilterLabels } from '#helpers/mediaEditions';
import BoxSelectionList from './BoxSelectionList';
import TransformedImageRenderer from './TransformedImageRenderer';
import type { CropData, Filter } from '#helpers/mediaEditions';
import type { BoxButtonItemInfo } from './BoxSelectionList';
import type { SkImage } from '@shopify/react-native-skia';
import type { ViewProps } from 'react-native';
import type { DerivedValue } from 'react-native-reanimated';

type FilterSelectionListProps = ViewProps & {
  skImage: DerivedValue<SkImage | null>;
  aspectRatio: number;
  selectedFilter: string | null;
  cropData?: CropData | null;
  cardRadius?: number;
  onChange(value: Filter | null): void;
};

const FilterSelectionList = ({
  skImage,
  aspectRatio,
  selectedFilter,
  cropData,
  onChange,
  ...props
}: FilterSelectionListProps) => {
  const filters = typedEntries(useFilterLabels());

  const renderItem = useCallback(
    ({ item, height, width }: BoxButtonItemInfo<[Filter, string] | null>) => {
      const filter = item?.[0];
      return (
        <TransformedImageRenderer
          image={skImage}
          width={width}
          height={height}
          filter={filter}
          editionParameters={{
            cropData,
          }}
        />
      );
    },
    [skImage, cropData],
  );

  const onSelect = useCallback(
    (item: [Filter, string] | null) => {
      onChange(item ? item[0] : null);
    },
    [onChange],
  );

  const intl = useIntl();

  const renderLabel = useCallback(
    ({ item }: BoxButtonItemInfo<[string, string]>) => {
      return (
        item?.[1] ??
        intl.formatMessage({
          defaultMessage: 'Normal',
          description:
            'Name of the default filter (no filter applied) in image edition',
        })
      );
    },
    [intl],
  );

  return (
    <BoxSelectionList
      data={filters}
      renderItem={renderItem}
      renderLabel={renderLabel}
      keyExtractor={keyExtractor}
      accessibilityRole="list"
      onSelect={onSelect}
      imageRatio={aspectRatio}
      selectedItem={filters.find(item => item[0] === selectedFilter) ?? null}
      {...props}
    />
  );
};

const keyExtractor = (item: [string, string]) => item[0];

export default FilterSelectionList;
