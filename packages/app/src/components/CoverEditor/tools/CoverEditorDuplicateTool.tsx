import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import ToolBoxSection from '#ui/ToolBoxSection';
import { useCoverEditorContext } from '../CoverEditorContext';

const CoverEditorDuplicateTool = () => {
  const intl = useIntl();

  const { dispatch } = useCoverEditorContext();

  const onDuplicatePress = useCallback(() => {
    dispatch({
      type: 'DUPLICATE',
    });
  }, [dispatch]);

  return (
    <ToolBoxSection
      label={intl.formatMessage({
        defaultMessage: 'Duplicate',
        description: 'Cover Edition - Toolbox sub-menu text - Duplicate',
      })}
      icon="duplicate"
      onPress={onDuplicatePress}
    />
  );
};

export default CoverEditorDuplicateTool;
