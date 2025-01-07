import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useCoverEditorEditContext } from '#components/CoverEditor/CoverEditorContext';
import ToolBoxSection from '../../../Toolbar/ToolBoxSection';

const CoverEditorDeleteTool = () => {
  const intl = useIntl();

  const dispatch = useCoverEditorEditContext();

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
