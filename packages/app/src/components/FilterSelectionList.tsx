import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { View, type ViewProps } from 'react-native';
import { typedEntries } from '@azzapp/shared/objectHelpers';
import { useFilterLabels } from '#helpers/mediaEditions';
import BoxSelectionList from './BoxSelectionList';
import TransformedImageRenderer from './TransformedImageRenderer';
import type { CropData } from '#helpers/mediaEditions';
import type { Media } from '#helpers/mediaHelpers';
import type { BoxButtonItemInfo } from './BoxSelectionList';
import type { Filter } from '@azzapp/shared/filtersHelper';
import type { SkImage } from '@shopify/react-native-skia';
import type { DerivedValue } from 'react-native-reanimated';

type FilterSelectionListProps = ViewProps & {
  skImage: DerivedValue<SkImage | null>;
  aspectRatio: number;
  selectedFilter: string | null;
  cropData?: CropData | null;
  cardRadius?: number;
  media: Media | null;
  onChange(value: Filter | null): void;
  isSkImageReady: boolean;
};

const FilterSelectionList = ({
  skImage,
  aspectRatio,
  selectedFilter,
  cropData,
  onChange,
  media,
  isSkImageReady,
  ...props
}: FilterSelectionListProps) => {
  const filters = typedEntries(useFilterLabels());

  const filterListerCropData = useMemo(() => {
    let result = cropData;
    if (
      isSkImageReady &&
      cropData &&
      media &&
      skImage.value &&
      media.width !== skImage.value.width()
    ) {
      const scale = skImage.value.width() / media.width;
      result = {
        originX: cropData.originX * scale,
        originY: cropData.originY * scale,
        width: cropData.width * scale,
        height: cropData.height * scale,
      };
    }
    return result;
  }, [cropData, isSkImageReady, media, skImage.value]);

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
            cropData: filterListerCropData,
          }}
        />
      );
    },
    [skImage, filterListerCropData],
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

  const limitedImageRatio = Math.min(
    Math.max(aspectRatio, SELECTION_MINIMUM_IMAGE_RATIO),
    SELECTION_MAXIMUM_IMAGE_RATIO,
  );

  const selectionHeight = useMemo(() => {
    return (
      SELECTION_MAXIMUM_HEIGHT -
      (limitedImageRatio - SELECTION_MINIMUM_IMAGE_RATIO) *
        SELECTION_IMAGE_STEP_HEIGHT
    );
  }, [limitedImageRatio]);

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <View style={{ height: selectionHeight }}>
        <BoxSelectionList
          data={filters}
          renderItem={renderItem}
          renderLabel={renderLabel}
          keyExtractor={keyExtractor}
          accessibilityRole="list"
          onSelect={onSelect}
          imageRatio={limitedImageRatio}
          selectedItem={
            filters.find(item => item[0] === selectedFilter) ?? null
          }
          fixedItemWidth={140}
          {...props}
        />
      </View>
    </View>
  );
};

const keyExtractor = (item: [string, string] | null, index: number) =>
  item?.[0] ?? `${index}`;

const SELECTION_MINIMUM_IMAGE_RATIO = 0.5;
const SELECTION_MAXIMUM_IMAGE_RATIO = 2;
const SELECTION_MAXIMUM_HEIGHT = 170;
const SELECTION_IMAGE_STEP_HEIGHT = 26;

export default FilterSelectionList;
