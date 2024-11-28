import { memo } from 'react';
import { useIntl } from 'react-intl';
import {
  useCoverEditorEditContext,
  useCurrentLayer,
} from '../../CoverEditorContext';
import ToolBoxSection from '../ui/ToolBoxSection';

const CoverEditorShadowTool = () => {
  const dispatch = useCoverEditorEditContext();
  const { kind, layer } = useCurrentLayer();

  const hasShadow =
    ((kind === 'overlay' || kind === 'text' || kind === 'links') &&
      layer?.shadow) ??
    false;

  const save = () => {
    dispatch({
      type: 'UPDATE_LAYER_SHADOW',
      payload: {
        enabled: !hasShadow,
      },
    });
  };
  const intl = useIntl();

  return (
    <ToolBoxSection
      icon={hasShadow ? 'shadow_element' : 'shadow_element_off'}
      label={intl.formatMessage({
        defaultMessage: 'Shadows',
        description: 'Cover Edition Overlay Tool Button- Shadows',
      })}
      onPress={save}
    />
  );
};

export default memo(CoverEditorShadowTool);
