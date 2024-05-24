import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '#theme';
import {
  CancelHeaderButton,
  DoneHeaderButton,
} from '#components/commonsButtons';
import ScreenModal from '#components/ScreenModal';
import useToggle from '#hooks/useToggle';
import Header from '#ui/Header';
import SafeAreaView from '#ui/SafeAreaView';
import ToolBoxSection from '#ui/ToolBoxSection';
import { CoverEditorActionType } from '../coverEditorActions';
import {
  useCoverEditorContext,
  useCoverEditorOverlayLayer,
} from '../CoverEditorContext';
import type { SharedValue } from 'react-native-reanimated';

const CoverEditorImageCropTool = () => {
  const [show, toggleBottomSheet] = useToggle(false);
  const layer = useCoverEditorOverlayLayer();
  const { dispatch } = useCoverEditorContext();
  const [imageAreaHeight, setImageAreaHeight] = useState(() => {
    if (layer) {
      return IMAGE_AREA_WDITH * (layer?.height / layer.width);
    } else {
      return IMAGE_AREA_WDITH;
    }
  });
  const top = useSharedValue(0);
  const left = useSharedValue(0);
  const boxWidth = useSharedValue(IMAGE_AREA_WDITH);
  const boxHeight = useSharedValue(imageAreaHeight);

  useEffect(() => {
    //resetting on change image
    if (layer) {
      setImageAreaHeight(IMAGE_AREA_WDITH * (layer.height / layer.width));
      top.value = 0;
      left.value = 0;
      boxWidth.value = IMAGE_AREA_WDITH;
      boxHeight.value = imageAreaHeight;
    }
  }, [
    boxHeight,
    boxWidth,
    imageAreaHeight,
    left,
    layer?.uri,
    layer?.height,
    layer?.width,
    top,
    layer,
  ]);

  //#region animation

  const cropViewAnimatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      top: top.value,
      height: boxHeight.value,
      left: left.value,
      width: boxWidth.value,
    };
  }, []);

  const initialPosition = useSharedValue({
    top: 0,
    left: 0,
  });
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .onStart(() => {
      initialPosition.value = {
        top: top.value,
        left: left.value,
      };
    })
    .onUpdate(event => {
      left.value = clamp(
        initialPosition.value.left + event.translationX,
        0,
        IMAGE_AREA_WDITH - boxWidth.value,
      );
      top.value = clamp(
        initialPosition.value.top + event.translationY,
        0,
        imageAreaHeight - boxHeight.value,
      );
    });

  const initialDimension = useSharedValue({ width: 0, height: 0 });
  const pinch = Gesture.Pinch()
    .onStart(() => {
      initialDimension.value = {
        width: boxWidth.value,
        height: boxHeight.value,
      };
    })
    .onUpdate(event => {
      boxWidth.value = clamp(
        initialDimension.value.width * event.scale,
        DRAG_ITEM_HEIGHT * 1.5,
        IMAGE_AREA_WDITH - left.value,
      );
      boxHeight.value = clamp(
        initialDimension.value.height * event.scale,
        DRAG_ITEM_HEIGHT * 1.5,
        imageAreaHeight - top.value,
      );
    });

  const leftWhiteAreaStyle = useAnimatedStyle(() => {
    return {
      top: 0,
      left: 0,
      width: left.value,
      height: imageAreaHeight,
    };
  });
  const topWhiteAreaStyle = useAnimatedStyle(() => {
    return {
      top: 0,
      left: left.value,
      width: boxWidth.value,
      height: top.value,
    };
  });
  const rightWhiteAreaStyle = useAnimatedStyle(() => {
    return {
      top: 0,
      left: left.value + boxWidth.value,
      width: IMAGE_AREA_WDITH - left.value - boxWidth.value,
      height: imageAreaHeight,
    };
  });
  const bottomWhiteAreaStyle = useAnimatedStyle(() => {
    return {
      top: top.value + boxHeight.value,
      left: left.value,
      width: boxWidth.value,
      height: imageAreaHeight - top.value - boxHeight.value,
    };
  });
  //#endRegion

  //#region image manipulation

  const save = useCallback(async () => {
    //cropping the item
    if (layer == null) {
      //should not happen in "normal way"
      dispatch({
        type: CoverEditorActionType.DeleteOverlayLayer,
      });
      toggleBottomSheet();
      return;
    }
    const ratio = layer.width / IMAGE_AREA_WDITH;
    const res = await manipulateAsync(
      layer.uri,
      [
        {
          crop: {
            originX: left.value * ratio,
            originY: top.value * ratio,
            width: boxWidth.value * ratio,
            height: boxHeight.value * ratio,
          },
        },
      ],
      {
        compress: 1.0,
        format: SaveFormat.PNG,
      },
    );
    dispatch({
      type: CoverEditorActionType.UpdateOverlayLayer,
      payload: { uri: res.uri, width: res.width, height: res.height },
    });
    toggleBottomSheet();
  }, [
    boxHeight.value,
    boxWidth.value,
    dispatch,
    layer,
    left.value,
    toggleBottomSheet,
    top.value,
  ]);

  const imageStyle = useMemo(() => {
    return {
      width: IMAGE_AREA_WDITH,
      height: imageAreaHeight,
    };
  }, [imageAreaHeight]);
  const intl = useIntl();
  return (
    <>
      <ToolBoxSection
        icon="crop"
        label={intl.formatMessage({
          defaultMessage: 'Crop',
          description: 'Cover Edition Overlay Tool Button- Crop',
        })}
        onPress={toggleBottomSheet}
      />
      {layer != null && (
        <ScreenModal visible={show}>
          <SafeAreaView style={{ flex: 1, marginBottom: 30 }}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Header
                leftElement={<CancelHeaderButton onPress={toggleBottomSheet} />}
                rightElement={<DoneHeaderButton onPress={save} />}
              />

              <View style={styles.container}>
                <Animated.View style={imageStyle}>
                  <Image
                    source={layer.uri}
                    contentFit="cover"
                    style={imageStyle}
                  />

                  <Animated.View style={[styles.areaBox, leftWhiteAreaStyle]} />
                  <Animated.View style={[styles.areaBox, topWhiteAreaStyle]} />
                  <Animated.View
                    style={[styles.areaBox, rightWhiteAreaStyle]}
                  />
                  <Animated.View
                    style={[styles.areaBox, bottomWhiteAreaStyle]}
                  />
                  <TopDragItem
                    top={top}
                    height={boxHeight}
                    left={left}
                    width={boxWidth}
                  />
                  <BottomDragItem
                    top={top}
                    height={boxHeight}
                    left={left}
                    width={boxWidth}
                  />
                  <LeftDragItem
                    top={top}
                    height={boxHeight}
                    left={left}
                    width={boxWidth}
                  />
                  <RightDragItem
                    top={top}
                    height={boxHeight}
                    left={left}
                    width={boxWidth}
                  />
                  <GestureDetector
                    gesture={Gesture.Simultaneous(panGesture, pinch)}
                  >
                    <Animated.View
                      style={[cropViewAnimatedStyle, styles.dashedBorder]}
                    />
                  </GestureDetector>
                </Animated.View>
              </View>
            </GestureHandlerRootView>
          </SafeAreaView>
        </ScreenModal>
      )}
    </>
  );
};
type DragItemProps = {
  top: SharedValue<number>;
  height: SharedValue<number>;
  left: SharedValue<number>;
  width: SharedValue<number>;
};
const LeftDragItem = ({ top, left, width, height }: DragItemProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      left: left.value - DRAG_ITEM_WIDTH / 2,
      top: top.value + height.value / 2 - DRAG_ITEM_HEIGHT / 2,
    };
  });
  const initialWidth = useSharedValue(0);
  const initialLeft = useSharedValue(0);
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          initialWidth.value = width.value;
          initialLeft.value = left.value;
        })
        .onUpdate(event => {
          const increasing = Math.max(
            0,
            initialLeft.value + event.translationX,
          );
          left.value = increasing;
          width.value = initialWidth.value - event.translationX;
        }),
    [initialLeft, initialWidth, left, width],
  );
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.dragItemContainer, animatedStyle]}>
        <View style={styles.dragItem} />
      </Animated.View>
    </GestureDetector>
  );
};

const RightDragItem = ({ top, left, width, height }: DragItemProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      left: left.value + width.value - DRAG_ITEM_WIDTH / 2,
      top: top.value + height.value / 2 - DRAG_ITEM_HEIGHT / 2,
    };
  });
  const initialWidth = useSharedValue(0);
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          initialWidth.value = width.value;
        })
        .onUpdate(event => {
          width.value = Math.max(0, initialWidth.value + event.translationX);
        }),
    [initialWidth, width],
  );

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.dragItemContainer, animatedStyle]}>
        <View style={styles.dragItem} />
      </Animated.View>
    </GestureDetector>
  );
};

const TopDragItem = ({ top, left, width, height }: DragItemProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: '90deg' }],
      left: width.value / 2 + left.value - DRAG_ITEM_WIDTH / 2,
      top: top.value - DRAG_ITEM_HEIGHT / 2,
    };
  });
  const initialHeight = useSharedValue(0);
  const initialTop = useSharedValue(0);
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          initialTop.value = top.value;
          initialHeight.value = height.value;
        })
        .onUpdate(event => {
          const increasing = Math.max(0, initialTop.value + event.translationY);
          top.value = increasing;
          height.value = initialHeight.value - event.translationY;
        }),
    [initialTop, top, initialHeight, height],
  );

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.dragItemContainer, animatedStyle]}>
        <View style={styles.dragItem} />
      </Animated.View>
    </GestureDetector>
  );
};

const BottomDragItem = ({ top, left, width, height }: DragItemProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: '90deg' }],
      left: width.value / 2 + left.value - DRAG_ITEM_WIDTH / 2,
      top: height.value + top.value - DRAG_ITEM_HEIGHT / 2,
    };
  });

  const initialHeight = useSharedValue(0);
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          initialHeight.value = height.value;
        })
        .onUpdate(event => {
          height.value = Math.max(0, initialHeight.value + event.translationY);
        }),
    [height, initialHeight],
  );
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.dragItemContainer, animatedStyle]}>
        <View style={styles.dragItem} />
      </Animated.View>
    </GestureDetector>
  );
};

export default memo(CoverEditorImageCropTool);
const DRAG_ITEM_HEIGHT = 30;
const DRAG_ITEM_WIDTH = 14;
const screenWidth = Dimensions.get('screen').width;
const IMAGE_MARGIN = 26;
const IMAGE_AREA_WDITH = screenWidth - 2 * IMAGE_MARGIN;

const styles = StyleSheet.create({
  dashedBorder: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  container: {
    flex: 1,
    margin: IMAGE_MARGIN,
    alignContent: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: '10%',
    marginBottom: 35,
  },
  dragItemContainer: {
    width: DRAG_ITEM_WIDTH,
    height: DRAG_ITEM_HEIGHT,
    borderRadius: 6,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  dragItem: {
    width: DRAG_ITEM_WIDTH - 12,
    height: DRAG_ITEM_HEIGHT - 10,
    backgroundColor: colors.white,
  },
  areaBox: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    position: 'absolute',
  },
});
export function rotate_aabb(
  xmin: number,
  ymin: number,
  width: number,
  height: number,
  angle: number,
) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  const x1 = c * width;
  const y1 = s * width;
  const x2 = -s * height;
  const y2 = c * height;

  const x3 = x1 + x2;
  const y3 = y1 + y2;

  const txmin = Math.min(0, x1, x2, x3);
  const txmax = Math.max(0, x1, x2, x3);
  const tymin = Math.min(0, y1, y2, y3);
  const tymax = Math.max(0, y1, y2, y3);

  const owidth = txmax - txmin;
  const oheight = tymax - tymin;
  const oxmin = xmin + txmin;
  const oymin = ymin + tymin;

  return { xmin: oxmin, ymin: oymin, width: owidth, height: oheight };
}
