import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useCoverEditorContext } from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';

const CoverEditorDeleteTool = () => {
  const intl = useIntl();

  const { dispatch } = useCoverEditorContext();

  const onDeletePress = useCallback(() => {
    dispatch({
      type: 'DELETE_CURRENT_LAYER',
    });
  }, [dispatch]);

  return (
    <ToolBoxSection
      label={intl.formatMessage({
        defaultMessage: 'Delete',
        description: 'Cover Edition - Toolbox sub-menu text - Delete',
      })}
      icon="trash_line"
      onPress={onDeletePress}
    />
  );
};

export default CoverEditorDeleteTool;
