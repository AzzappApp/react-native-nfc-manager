import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import BoxSelectionList from './BoxSelectionList';
import { GPUImageView, getFilterUri, useFilterLabels } from './gpu';
import type { BoxButtonItemInfo } from './BoxSelectionList';
import type { ImageLayer, VideoFrameLayer } from './gpu';
import type { ViewProps } from 'react-native';

type FilterSelectionListProps = ViewProps & {
  layer: ImageLayer | VideoFrameLayer;
  aspectRatio: number;
  selectedFilter: string | null;
  cardRadius?: number;
  onChange(value: string | null): void;
};

const FilterSelectionList = ({
  layer,
  aspectRatio,
  selectedFilter,
  onChange,
  ...props
}: FilterSelectionListProps) => {
  const filters = typedEntries(useFilterLabels());

  const renderItem = useCallback(
    ({ item, height, width }: BoxButtonItemInfo<[string, string]>) => {
      const filter = item?.[0];
      return (
        <GPUImageView
          style={{ height, width }}
          layers={[
            {
              ...layer,
              lutFilterUri: getFilterUri(filter),
            },
          ]}
        />
      );
    },
    [layer],
  );

  const onSelect = useCallback(
    (item: [string, string] | null) => {
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
