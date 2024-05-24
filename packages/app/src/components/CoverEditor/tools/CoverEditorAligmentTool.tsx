import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import ToolBoxSection from '#ui/ToolBoxSection';
import { CoverEditorActionType } from '../coverEditorActions';
import {
  useCoverEditorContext,
  useCoverEditorTextLayer,
} from '../CoverEditorContext';

const CoverEditorAlignmentTool = () => {
  const intl = useIntl();

  const { dispatch } = useCoverEditorContext();
  const layer = useCoverEditorTextLayer();
  const alignment = layer?.style.textAlign ?? 'justify';

  const onSetAlignment = useCallback(
    (alignment: 'center' | 'justify' | 'left' | 'right') => {
      dispatch({
        type: CoverEditorActionType.ChangeAlignment,
        payload: {
          alignment,
        },
      });
    },
    [dispatch],
  );

  const onAlignmentPress = useCallback(() => {
    if (alignment === 'justify') onSetAlignment('center');
    if (alignment === 'center') onSetAlignment('right');
    if (alignment === 'right') onSetAlignment('left');
    if (alignment === 'left') onSetAlignment('justify');
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
