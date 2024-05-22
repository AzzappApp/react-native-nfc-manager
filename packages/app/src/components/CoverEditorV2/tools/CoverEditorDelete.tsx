import { memo } from 'react';
import { useIntl } from 'react-intl';
import ToolBoxSection from '#ui/ToolBoxSection';
import { CoverEditorActionType } from '../coverEditorActions';
import { useCoverEditorContext } from '../CoverEditorContext';

const CoverEditorDelete = () => {
  const { dispatch } = useCoverEditorContext();
  const intl = useIntl();
  const onDelete = () => {
    dispatch({ type: CoverEditorActionType.DeleteOverlayLayer });
  };
  return (
    <ToolBoxSection
      icon="trash_line"
      label={intl.formatMessage({
        defaultMessage: 'Delete',
        description: 'Cover Edition Overlay Tool Button- Delete',
      })}
      onPress={onDelete}
    />
  );
};

export default memo(CoverEditorDelete);
