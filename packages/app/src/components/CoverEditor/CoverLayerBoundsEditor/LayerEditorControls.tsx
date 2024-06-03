import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import IconButton from '#ui/IconButton';
import { percentRectToRect } from '../coverEditorHelpers';
import ResizeHandle from './ResizeHandle';
import type {
  ResizeAxis,
  ResizeHandlePosition,
} from './coverBoundsLayerEditorTypes';
import type { SkRect, SkSize } from '@shopify/react-native-skia';

export type LayerEditorControlsProps = {
  bounds: SharedValue<SkRect>;
  rotation: SharedValue<number>;
  canvasSize: SkSize;
  resizeAxis: ResizeAxis[];
  controlsPosition: 'right' | 'top';
  active: boolean;
  hideControls: boolean;
  onEdit?: () => void;
  onCrop?: () => void;
  onDelete: () => void;
  onAxisResizeStart: (position: ResizeHandlePosition) => void;
  onAxisResizeUpdate: (
    position: ResizeHandlePosition,
    translation: number,
  ) => void;
  onAxisResizeEnd: (position: ResizeHandlePosition) => void;
};

const LayerEditorControls: React.FC<LayerEditorControlsProps> = ({
  bounds,
  rotation,
  canvasSize,
  resizeAxis,
  active,
  hideControls,
  controlsPosition,
  onAxisResizeStart,
  onAxisResizeUpdate,
  onAxisResizeEnd,
  onCrop,
  onEdit,
  onDelete,
}) => {
  const styles = useStyleSheet(styleSheet);

  const iconButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${-rotation.value}rad`,
        },
      ],
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    // eslint-disable-next-line prefer-const
    let { width, height } = percentRectToRect(
      bounds.value,
      canvasSize.width,
      canvasSize.height,
    );
    let marginVertical = 0;
    let marginHorizontal = 0;
    if (controlsPosition === 'right') {
      width += 30;
      height += 10;
      marginHorizontal = -15;
      marginVertical = -5;

      if (height < 70) {
        marginVertical = (height - 70) / 2;
        height = 70;
      }
    }
    return {
      opacity: active ? 1 : 0,
      width,
      height,
      borderColor: colors.red400,
      borderWidth: 1,
      zIndex: 10,
      marginVertical,
      marginHorizontal,
    };
  });

  const resizeHandlePositions = RESIZE_HANDLE_POSITIONS.filter(
    position =>
      ((position === 'top' || position === 'bottom') &&
        resizeAxis.includes('y')) ||
      ((position === 'left' || position === 'right') &&
        resizeAxis.includes('x')),
  );

  return (
    <Animated.View style={animatedStyle}>
      <Animated.View
        style={[
          controlsPosition === 'top'
            ? styles.controlsTop
            : styles.controlsRight,
          hideControls && { opacity: 0 },
        ]}
      >
        {onCrop && (
          <IconButton
            icon="crop"
            style={[styles.iconButton, iconButtonStyle]}
            iconStyle={styles.icon}
            onPress={onCrop}
            iconSize={20}
            size={30}
          />
        )}
        <IconButton
          icon="trash_line"
          style={[styles.iconButton, iconButtonStyle]}
          iconStyle={styles.icon}
          onPress={onDelete}
          iconSize={20}
          size={30}
        />
        {onEdit && (
          <IconButton
            icon="edit"
            style={[styles.iconButton, iconButtonStyle]}
            iconStyle={styles.icon}
            onPress={onEdit}
            iconSize={20}
            size={30}
          />
        )}
      </Animated.View>
      {resizeHandlePositions.map(position => (
        <ResizeHandle
          key={position}
          active={active}
          handlePosition={position}
          onAxisResizeStart={onAxisResizeStart}
          onAxisResizeUpdate={onAxisResizeUpdate}
          onAxisResizeEnd={onAxisResizeEnd}
        />
      ))}
    </Animated.View>
  );
};

export default LayerEditorControls;
const RESIZE_HANDLE_POSITIONS = ['top', 'bottom', 'left', 'right'] as const;
const MARGIN_TOP_BUTTONS_CONTROL = 50;
const BORDER_WIDTH = 2;

const styleSheet = createStyleSheet(appearance => ({
  controlsTop: {
    gap: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    top: -MARGIN_TOP_BUTTONS_CONTROL,
    left: 0,
    width: '100%',
  },
  controlsRight: {
    gap: 20,
    justifyContent: 'space-between',
    position: 'absolute',
    top: -15,
    bottom: -15,
    right: -15,
  },
  iconButton: {
    backgroundColor: appearance === 'dark' ? colors.white : colors.black,
    borderColor: appearance === 'dark' ? colors.black : colors.white,
    borderWidth: BORDER_WIDTH,
  },
  icon: {
    tintColor: colors.white,
  },
}));
