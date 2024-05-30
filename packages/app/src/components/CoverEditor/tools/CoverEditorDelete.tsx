import { memo } from 'react';
import { useIntl } from 'react-intl';
import ToolBoxSection from '#ui/ToolBoxSection';
import { useCoverEditorContext } from '../CoverEditorContext';

const CoverEditorDelete = () => {
  const { dispatch } = useCoverEditorContext();
  const intl = useIntl();
  const onDelete = () => {
    dispatch({ type: 'DELETE_OVERLAY_LAYER' });
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
