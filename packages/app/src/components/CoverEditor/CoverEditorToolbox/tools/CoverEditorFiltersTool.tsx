import { memo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { DoneHeaderButton } from '#components/commonsButtons';
import FilterSelectionList from '#components/FilterSelectionList';
import { useSkImage } from '#helpers/mediaEditions';

import useToggle from '#hooks/useToggle';
import BottomSheetModal from '#ui/BottomSheetModal';
import Text from '#ui/Text';
import {
  useCoverEditorContext,
  useCoverEditorActiveMedia,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';
import type { Filter } from '#helpers/mediaEditions';

const CoverEditorFiltersTool = () => {
  const [show, toggleBottomSheet] = useToggle(false);
  const mediaInfo = useCoverEditorActiveMedia();
  const { dispatch } = useCoverEditorContext();

  const onSelect = useCallback(
    (filter: Filter | null) => {
      dispatch({
        type: 'UPDATE_MEDIA_FILTER',
        payload: filter,
      });
    },
    [dispatch],
  );

  const media = mediaInfo?.media;
  const cropData = mediaInfo?.editionParameters?.cropData;

  const image = useSkImage({
    uri: media?.uri,
    kind: media?.kind,
    time: 0,
  });
  const aspectRatio = cropData
    ? cropData.width / cropData.height
    : media
      ? media.width / media.height
      : 1;

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
                defaultMessage="Effects"
                description="CoverEditor Effects Tool - Title"
              />
            </Text>
          }
          headerRightButton={<DoneHeaderButton onPress={toggleBottomSheet} />}
          contentContainerStyle={{ paddingHorizontal: 0 }}
          headerStyle={{ paddingHorizontal: 20 }}
        >
          <FilterSelectionList
            skImage={image}
            aspectRatio={aspectRatio}
            cropData={cropData}
            selectedFilter={mediaInfo.filter}
            cardRadius={20}
            onChange={onSelect}
          />
        </BottomSheetModal>
      )}
    </>
  );
};

export default memo(CoverEditorFiltersTool);
