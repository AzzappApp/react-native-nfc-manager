import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useCoverEditorEditContext } from '#components/CoverEditor/CoverEditorContext';
import ToolBoxSection from '../../../Toolbar/ToolBoxSection';

const CoverEditorDuplicateTool = () => {
  const intl = useIntl();

  const dispatch = useCoverEditorEditContext();

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
