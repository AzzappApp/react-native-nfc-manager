import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import ToolBoxSection from '#ui/ToolBoxSection';
import { useCoverEditorContext } from '../CoverEditorContext';

const CoverEditorDeleteTool = () => {
  const intl = useIntl();

  const { dispatch } = useCoverEditorContext();

  const onDeletePress = useCallback(() => {
    dispatch({
      type: 'DELETE',
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
