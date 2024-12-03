import { memo } from 'react';
import { useIntl } from 'react-intl';
import { useCoverEditorEditContext } from '#components/CoverEditor/CoverEditorContext';
import ToolBoxSection from '../../../Toolbar/ToolBoxSection';

const CoverEditorDelete = () => {
  const dispatch = useCoverEditorEditContext();
  const intl = useIntl();
  const onDelete = () => {
    dispatch({ type: 'DELETE_CURRENT_LAYER' });
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
