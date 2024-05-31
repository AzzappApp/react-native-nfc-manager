import { Image } from 'expo-image';
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
import {
  useCoverEditorActiveMedia,
  useCoverEditorContext,
} from '../CoverEditorContext';
import type { SharedValue } from 'react-native-reanimated';

const CoverEditorImageCropTool = () => {
  const [show, toggleBottomSheet] = useToggle(false);
  const layer = useCoverEditorActiveMedia();
  const { dispatch } = useCoverEditorContext();

  const [imageAreaHeight, setImageAreaHeight] = useState(() => {
    if (layer?.media) {
      return IMAGE_AREA_WIDTH * (layer.media?.height / layer.media.width);
    } else {
      return IMAGE_AREA_WIDTH;
    }
  });
  const bottom = useSharedValue(0);
  const left = useSharedValue(0);
  const boxWidth = useSharedValue(IMAGE_AREA_WIDTH);
  const boxHeight = useSharedValue(imageAreaHeight);

  useEffect(() => {
    if (layer?.media) {
      setImageAreaHeight(
        IMAGE_AREA_WIDTH * (layer.media.height / layer.media.width),
      );
      if (layer?.editionParameters?.cropData) {
        const cropData = layer?.editionParameters?.cropData;
        bottom.value =
          (cropData.originY * imageAreaHeight) / layer.media.height;
        left.value = (cropData.originX * IMAGE_AREA_WIDTH) / layer.media.width;
        boxWidth.value =
          (cropData.width / layer.media.width) * IMAGE_AREA_WIDTH;
        boxHeight.value =
          (cropData.height / layer.media.height) * imageAreaHeight;
      } else {
        bottom.value = 0;
        left.value = 0;
        boxWidth.value = IMAGE_AREA_WIDTH;
        boxHeight.value = imageAreaHeight;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    imageAreaHeight,
    layer?.editionParameters?.cropData,
    boxWidth,
    boxHeight,
  ]);

  //#region animation

  const cropViewAnimatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      bottom: bottom.value,
      height: boxHeight.value,
      left: left.value,
      width: boxWidth.value,
    };
  });

  const initialPosition = useSharedValue({
    bottom: 0,
    left: 0,
  });
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .onStart(() => {
      initialPosition.value = {
        bottom: bottom.value,
        left: left.value,
      };
    })
    .onUpdate(event => {
      left.value = clamp(
        initialPosition.value.left + event.translationX,
        0,
        IMAGE_AREA_WIDTH - boxWidth.value,
      );
      bottom.value = clamp(
        initialPosition.value.bottom - event.translationY,
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
        IMAGE_AREA_WIDTH - left.value,
      );
      boxHeight.value = clamp(
        initialDimension.value.height * event.scale,
        DRAG_ITEM_HEIGHT * 1.5,
        imageAreaHeight - bottom.value,
      );
    });

  const leftWhiteAreaStyle = useAnimatedStyle(() => {
    return {
      bottom: 0,
      left: 0,
      width: left.value,
      height: imageAreaHeight,
    };
  });
  const topWhiteAreaStyle = useAnimatedStyle(() => {
    return {
      bottom: bottom.value + boxHeight.value,
      left: left.value,
      width: boxWidth.value,
      height: imageAreaHeight - bottom.value,
    };
  });
  const rightWhiteAreaStyle = useAnimatedStyle(() => {
    return {
      bottom: 0,
      left: left.value + boxWidth.value,
      width: IMAGE_AREA_WIDTH - left.value - boxWidth.value,
      height: imageAreaHeight,
    };
  });
  const bottomWhiteAreaStyle = useAnimatedStyle(() => {
    return {
      bottom: 0,
      left: left.value,
      width: boxWidth.value,
      height: bottom.value,
    };
  });
  //#endRegion

  //#region image manipulation

  const save = useCallback(async () => {
    if (layer?.media) {
      const cropData = {
        originX: (left.value * layer.media.width) / IMAGE_AREA_WIDTH,
        originY: (bottom.value * layer.media.height) / imageAreaHeight,
        width: (layer.media.width * boxWidth.value) / IMAGE_AREA_WIDTH,
        height: (layer.media.height * boxHeight.value) / imageAreaHeight,
      };

      dispatch({
        type: 'UPDATE_MEDIA_EDITION_PARAMETERS',
        payload: {
          ...(layer.editionParameters ?? {}),
          cropData,
        },
      });
      toggleBottomSheet();
    }
  }, [
    layer?.media,
    layer?.editionParameters,
    boxHeight.value,
    imageAreaHeight,
    dispatch,
    left.value,
    bottom.value,
    boxWidth.value,
    toggleBottomSheet,
  ]);

  const imageStyle = useMemo(() => {
    return {
      width: IMAGE_AREA_WIDTH,
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
                    source={layer?.media.uri}
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
                  <GestureDetector
                    gesture={Gesture.Simultaneous(panGesture, pinch)}
                  >
                    <Animated.View
                      style={[cropViewAnimatedStyle, styles.dashedBorder]}
                    />
                  </GestureDetector>
                  <TopDragItem
                    bottom={bottom}
                    height={boxHeight}
                    left={left}
                    width={boxWidth}
                    maxHeight={imageAreaHeight}
                  />
                  <BottomDragItem
                    bottom={bottom}
                    height={boxHeight}
                    left={left}
                    width={boxWidth}
                  />
                  <LeftDragItem
                    bottom={bottom}
                    height={boxHeight}
                    left={left}
                    width={boxWidth}
                  />
                  <RightDragItem
                    bottom={bottom}
                    height={boxHeight}
                    left={left}
                    width={boxWidth}
                  />
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
  bottom: SharedValue<number>;
  height: SharedValue<number>;
  left: SharedValue<number>;
  width: SharedValue<number>;
};
const LeftDragItem = ({ bottom, left, width, height }: DragItemProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      left: left.value - DRAG_ITEM_WIDTH / 2,
      bottom: bottom.value + height.value / 2 - DRAG_ITEM_HEIGHT / 2,
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
          if (increasing > 0 && initialWidth.value - event.translationX > 20) {
            width.value = initialWidth.value - event.translationX;
          }
        }),
    [initialLeft, initialWidth, left, width],
  );
  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.dragItemContainer, animatedStyle]}
        hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
      >
        <View style={styles.dragItem} />
      </Animated.View>
    </GestureDetector>
  );
};

const RightDragItem = ({ bottom, left, width, height }: DragItemProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      left: left.value + width.value - DRAG_ITEM_WIDTH / 2,
      bottom: bottom.value + height.value / 2 - DRAG_ITEM_HEIGHT / 2,
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
          if (
            initialWidth.value + event.translationX <
            IMAGE_AREA_WIDTH - left.value
          ) {
            width.value = Math.max(20, initialWidth.value + event.translationX);
          } else {
            width.value = IMAGE_AREA_WIDTH - left.value;
          }
        }),
    [initialWidth, left.value, width],
  );

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.dragItemContainer, animatedStyle]}
        hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
      >
        <View style={styles.dragItem} />
      </Animated.View>
    </GestureDetector>
  );
};

const TopDragItem = ({
  bottom,
  left,
  width,
  height,
  maxHeight,
}: DragItemProps & { maxHeight: number }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: '90deg' }],
      left: width.value / 2 + left.value - DRAG_ITEM_WIDTH / 2,
      bottom: height.value + bottom.value - DRAG_ITEM_HEIGHT / 2,
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
          height.value = Math.min(
            initialHeight.value - event.translationY,
            maxHeight - bottom.value,
          );
        }),
    [initialHeight, height, maxHeight, bottom.value],
  );

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.dragItemContainer, animatedStyle]}
        hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
      >
        <View style={styles.dragItem} />
      </Animated.View>
    </GestureDetector>
  );
};

const BottomDragItem = ({ bottom, left, width, height }: DragItemProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: '90deg' }],
      left: width.value / 2 + left.value - DRAG_ITEM_WIDTH / 2,
      bottom: bottom.value - DRAG_ITEM_HEIGHT / 2,
    };
  });

  const initialHeight = useSharedValue(0);
  const initialBottom = useSharedValue(0);
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          initialHeight.value = height.value;
          initialBottom.value = bottom.value;
        })
        .onUpdate(event => {
          const increasing = Math.max(
            0,
            initialBottom.value - event.translationY,
          );
          if (increasing > 0 && initialHeight.value + event.translationY > 20) {
            bottom.value = increasing;
            height.value = Math.max(
              0,
              initialHeight.value + event.translationY,
            );
          }
        }),
    [bottom, height, initialBottom, initialHeight],
  );
  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.dragItemContainer, animatedStyle]}
        hitSlop={{ left: 20, right: 20, top: 20, bottom: 20 }}
      >
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
const IMAGE_AREA_WIDTH = screenWidth - 2 * IMAGE_MARGIN;

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
    zIndex: 100,
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
