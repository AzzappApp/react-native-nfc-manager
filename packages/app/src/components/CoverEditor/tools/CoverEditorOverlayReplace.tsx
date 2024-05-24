import { memo } from 'react';
import { useIntl } from 'react-intl';
import ImagePicker, { SelectImageStep } from '#components/ImagePicker';
import ScreenModal from '#components/ScreenModal';
import useToggle from '#hooks/useToggle';
import ToolBoxSection from '#ui/ToolBoxSection';
import { CoverEditorActionType } from '../coverEditorActions';
import { useCoverEditorContext } from '../CoverEditorContext';

import type { ImagePickerResult } from '#components/ImagePicker';

const CoverEditorOverlayReplace = () => {
  const [show, toggleShowImagePicker] = useToggle(false);
  const { dispatch } = useCoverEditorContext();
  const intl = useIntl();

  return (
    <>
      <ToolBoxSection
        icon="refresh"
        label={intl.formatMessage({
          defaultMessage: 'Replace',
          description: 'Cover Edition Overlay Tool Button- Replace',
        })}
        onPress={toggleShowImagePicker}
      />
      <ScreenModal visible={show} animationType="slide">
        <ImagePicker
          kind="image"
          steps={[SelectImageStep]}
          onFinished={(param: ImagePickerResult) => {
            dispatch({
              type: CoverEditorActionType.UpdateOverlayLayer,
              payload: {
                uri: param.uri,
                width: param.width,
                height: param.height,
              },
            });

            toggleShowImagePicker();
          }}
          onCancel={() => {
            toggleShowImagePicker();
          }}
        />
      </ScreenModal>
    </>
  );
};

export default memo(CoverEditorOverlayReplace);
