import { useMemo } from 'react';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import IconButton from '#ui/IconButton';

import { ScaleFactor } from './LayerEditorHelper';
import ResizeHandle from './ResizeHandle';
import type { Icons } from '#ui/Icon';
import type { ResizeAxis, ResizeHandleAxis, WorkspaceLimits } from './type';
import type { Matrix4 } from '@shopify/react-native-skia';

export type LayerEditorControlsProps = {
  matrix: SharedValue<Matrix4>;
  onCrop?: () => void;
  onDelete?: () => void;
  onResize?: (axis: ResizeAxis, value: number) => void;
  resize?: boolean;
  limits: WorkspaceLimits;
  workspace: { width: SharedValue<number>; height: SharedValue<number> };
  resizeAxis: ResizeHandleAxis;
  isActivated?: boolean;
};

type EditorControl = {
  icon: Icons;
  onPress: () => void;
};

const MARGIN_TOP_BUTTONS_CONTROL = 50;
const BORDER_WIDTH = 2;

const LayerEditorControls: React.FC<LayerEditorControlsProps> = ({
  matrix,
  resize = false,
  limits,
  workspace,
  resizeAxis,
  isActivated = false,
  onResize,
  onCrop,
  onDelete,
}) => {
  const styles = useStyleSheet(styleSheet);

  const EditorControls = useMemo<EditorControl[]>(
    () => [
      {
        icon: 'crop',
        // TODO: Update the onCrop method according to the real case
        onPress: () => onCrop?.(),
      },
      {
        icon: 'trash_line',
        // TODO: Update the onDelete method according to the real case
        onPress: () => onDelete?.(),
      },
    ],
    [onCrop, onDelete],
  );

  const controlStyle = useAnimatedStyle(() => {
    const factor = ScaleFactor(matrix);
    return {
      transform: [{ scale: Math.min(factor, 1) }],
    };
  });

  const iconButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${Math.atan2(matrix.value[1], matrix.value[0])}rad`,
        },
      ],
    };
  });

  const workspaceStyle = useAnimatedStyle(() => {
    const factor = ScaleFactor(matrix);

    return {
      width: workspace.width.value,
      height: workspace.height.value,
      borderColor: isActivated ? colors.red400 : 'transparent',
      borderWidth: isActivated ? 2 * factor : 0,
      zIndex: isActivated ? 10 : 0,
    };
  });

  return (
    <Animated.View style={[workspaceStyle]}>
      <Animated.View style={[styles.content, controlStyle]}>
        {EditorControls.map(({ icon, onPress }) => (
          <IconButton
            key={icon}
            icon={icon}
            style={[styles.iconButton, iconButtonStyle]}
            iconStyle={styles.icon}
            onPress={onPress}
            iconSize={20}
            size={30}
          />
        ))}
      </Animated.View>
      {resize && resizeAxis.includes('y') ? (
        <>
          <ResizeHandle
            matrix={matrix}
            axis="y"
            handlePosition="top"
            limits={limits}
            workspace={workspace}
            onResize={onResize}
          />
          <ResizeHandle
            matrix={matrix}
            axis="y"
            handlePosition="bottom"
            limits={limits}
            workspace={workspace}
            onResize={onResize}
          />
        </>
      ) : null}
      {resize && resizeAxis.includes('x') ? (
        <>
          <ResizeHandle
            matrix={matrix}
            axis="x"
            handlePosition="right"
            limits={limits}
            workspace={workspace}
            onResize={onResize}
          />

          <ResizeHandle
            matrix={matrix}
            axis="x"
            handlePosition="left"
            limits={limits}
            workspace={workspace}
            onResize={onResize}
          />
        </>
      ) : null}
    </Animated.View>
  );
};

export default LayerEditorControls;

const styleSheet = createStyleSheet(appearance => ({
  content: {
    gap: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  iconButton: {
    marginTop: -MARGIN_TOP_BUTTONS_CONTROL,
    backgroundColor: appearance === 'dark' ? colors.white : colors.black,
    borderColor: appearance === 'dark' ? colors.black : colors.white,
    borderWidth: BORDER_WIDTH,
  },
  icon: {
    tintColor: colors.white,
  },
}));
