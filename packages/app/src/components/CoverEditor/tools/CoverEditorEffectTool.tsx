import { Image } from 'expo-image';
import { memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { shadow } from '#theme';
import { DoneHeaderButton } from '#components/commonsButtons';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { FILTERS, useOrdonedFilters } from '#helpers/mediaEditions';
import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import Text from '#ui/Text';
import ToolBoxSection from '#ui/ToolBoxSection';
import {
  useCoverEditorContext,
  useCoverEditoActiveMedia,
} from '../CoverEditorContext';
import CoverEditorSelectionList, {
  BORDER_RADIUS_RATIO,
  BOX_WIDTH,
} from './CoverEditorSelectionList';
import type { Filter } from '#helpers/mediaEditions';

const CoverEditorEffectTool = () => {
  const filters = useOrdonedFilters();
  const [show, toggleBottomSheet] = useToggle(false);
  const mediaInfo = useCoverEditoActiveMedia();
  const { dispatch } = useCoverEditorContext();

  const onSelect = useCallback(
    (filter: string) => {
      console.log(filter);
      dispatch({
        type: 'UPDATE_MEDIA_FILTER',
        payload: filter as Filter, // Add index signature to allow indexing with a string
      });
    },
    [dispatch],
  );
  const intl = useIntl();

  return (
    <>
      <ToolBoxSection
        icon="filters"
        label={intl.formatMessage({
          defaultMessage: 'Effects',
          description: 'Cover Edition Overlay Tool Button- Effect',
        })}
        onPress={toggleBottomSheet}
      />
      {mediaInfo != null && (
        <BottomSheetModal
          onRequestClose={toggleBottomSheet}
          visible={show}
          height={271}
          headerTitle={
            <Text variant="large">
              <FormattedMessage
                defaultMessage="Effects(TODO DEFINE LIST FOR SKIA)"
                description="CoverEditor Effects Tool - Title"
              />
            </Text>
          }
          headerRightButton={<DoneHeaderButton onPress={toggleBottomSheet} />}
          contentContainerStyle={{ paddingHorizontal: 0 }}
          headerStyle={{ paddingHorizontal: 20 }}
        >
          <CoverEditorSelectionList
            data={filters}
            renderItem={renderItem}
            accessibilityRole="list"
            onSelect={onSelect}
            selectedItemId={mediaInfo.filter ?? 'none'}
          />
        </BottomSheetModal>
      )}
    </>
  );
};

export default memo(CoverEditorEffectTool);

type FilterItem = { id: string; label: string };

const renderItem = (item: FilterItem) => {
  return <FilterOverlay filter={item} />;
};

const FilterOverlay = ({ filter }: { filter: FilterItem }) => {
  const styles = useStyleSheet(styleSheet);

  return (
    <View style={styles.itemPreview}>
      <Image
        style={{ width: BOX_WIDTH, aspectRatio: 1, borderRadius: 7 }}
        source={FILTERS[filter.id as Filter]}
      />
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  itemPreview: {
    width: BOX_WIDTH,
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS_RATIO,
    overflow: 'hidden',
    ...shadow(appearance, 'bottom'),
  },
}));
