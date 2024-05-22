import { memo } from 'react';
import { useIntl } from 'react-intl';
import ToolBoxSection from '#ui/ToolBoxSection';
import { CoverEditorActionType } from '../coverEditorActions';
import {
  useCoverEditorOverlayLayer,
  useCoverEditorContext,
} from '../CoverEditorContext';

const CoverEditorShadowTool = () => {
  const layer = useCoverEditorOverlayLayer(); //use directly the layer for now, only one animated
  const { dispatch } = useCoverEditorContext();
  const save = () => {
    dispatch({
      type: CoverEditorActionType.UpdateLayerShadow,
      payload: {
        shadow: layer?.style.shadow
          ? undefined
          : {
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 0,
              },
              shadowOpacity: 0.2,
              shadowRadius: 10,
            },
        elevation: layer?.style.elevation ? 0 : 10,
      },
    });
  };
  const intl = useIntl();

  return (
    <ToolBoxSection
      icon={layer?.style.shadow ? 'shadow_element' : 'shadow_element_off'}
      label={intl.formatMessage({
        defaultMessage: 'Shadows',
        description: 'Cover Edition Overlay Tool Button- Shadows',
      })}
      onPress={save}
    />
  );
};

export default memo(CoverEditorShadowTool);
