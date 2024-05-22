import { memo, useCallback } from 'react';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import { CoverEditorActionType } from '../coverEditorActions';
import { useCoverEditorContext } from '../CoverEditorContext';
import type { Icons } from '#ui/Icon';
import type { CoverLayerType } from '../CoverTypes';

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
  const styles = useStyleSheet(stylesToolbox);
  const { dispatch } = useCoverEditorContext();
  const onPressButton = useCallback(() => {
    onPress?.();
    dispatch({
      type: CoverEditorActionType.SetLayerMode,
      payload: id,
    });
  }, [dispatch, id, onPress]);

  return (
    <PressableOpacity style={styles.toolbox} onPress={onPressButton}>
      {icon && <Icon icon={icon} />}
      {label && <Text variant="xsmall">{label}</Text>}
    </PressableOpacity>
  );
};

export const TOOLBOX_SECTION_HEIGHT = 66;

export const stylesToolbox = createStyleSheet(appearance => ({
  toolbox: {
    display: 'flex',
    paddingVertical: 8,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: 1,
    flexShrink: 0,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderRadius: 10,
    width: 70,
    height: TOOLBOX_SECTION_HEIGHT,
  },
}));

export default memo(CoverEditorToolboxItem);
