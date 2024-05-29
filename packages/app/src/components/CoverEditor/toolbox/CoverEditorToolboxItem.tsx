import { memo, useCallback } from 'react';
import ToolBoxSection from '#ui/ToolBoxSection';
import { CoverEditorActionType } from '../coverEditorActions';
import { useCoverEditorContext } from '../CoverEditorContext';
import type { Icons } from '#ui/Icon';
import type { CoverLayerType } from '../coverEditorTypes';

export type CoverEditorToolboxItemProps = {
  id: CoverLayerType;
  label: string;
  icon: Icons;
  onPress?: () => void;
};

const CoverEditorToolboxItem = ({
  id,
  label,
  icon,
  onPress,
}: CoverEditorToolboxItemProps) => {
  const { dispatch } = useCoverEditorContext();
  const onPressButton = useCallback(() => {
    onPress?.();
    dispatch({
      type: CoverEditorActionType.SetLayerMode,
      payload: id,
    });
  }, [dispatch, id, onPress]);

  return <ToolBoxSection icon={icon} label={label} onPress={onPressButton} />;
};

export default memo(CoverEditorToolboxItem);
