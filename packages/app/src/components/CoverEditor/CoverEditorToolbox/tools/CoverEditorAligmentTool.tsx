import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import {
  useCoverEditorEditContext,
  useCoverEditorTextLayer,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';

const CoverEditorAlignmentTool = () => {
  const intl = useIntl();

  const dispatch = useCoverEditorEditContext();
  const layer = useCoverEditorTextLayer();
  const alignment = layer?.textAlign ?? 'left';

  const onSetAlignment = useCallback(
    (alignment: 'center' | 'left' | 'right') => {
      dispatch({
        type: 'UPDATE_TEXT_LAYER',
        payload: {
          textAlign: alignment,
        },
      });
    },
    [dispatch],
  );

  const onAlignmentPress = useCallback(() => {
    if (alignment === 'left') onSetAlignment('center');
    if (alignment === 'center') onSetAlignment('right');
    if (alignment === 'right') onSetAlignment('left');
  }, [alignment, onSetAlignment]);

  return (
    <ToolBoxSection
      label={intl.formatMessage({
        defaultMessage: 'Alignment',
        description: 'Cover Edition - Toolbox sub-menu text - Alignment',
      })}
      icon={`txt_align_${alignment}`}
      onPress={onAlignmentPress}
    />
  );
};

export default CoverEditorAlignmentTool;
