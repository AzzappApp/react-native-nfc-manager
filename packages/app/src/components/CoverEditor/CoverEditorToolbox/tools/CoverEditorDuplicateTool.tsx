import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useCoverEditorContext } from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';

const CoverEditorDuplicateTool = () => {
  const intl = useIntl();

  const { dispatch } = useCoverEditorContext();

  const onDuplicatePress = useCallback(() => {
    dispatch({ type: 'DUPLICATE_CURRENT_LAYER' });
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
