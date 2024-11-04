import { clamp } from '@shopify/react-native-skia';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import {
  captureSnapshot,
  SnapshotRenderer,
} from '@azzapp/react-native-snapshot-view';
import { waitTime } from '@azzapp/shared/asyncHelpers';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_CARD_RADIUS,
  COVER_IMAGE_DEFAULT_DURATION,
  COVER_RATIO,
  LINKS_GAP,
  calculateLinksSize,
  convertToBaseCanvasRatio,
} from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import ImagePicker, { EditImageStep } from '#components/ImagePicker';
import {
  useModalInterceptor,
  useScreenHasFocus,
  ScreenModal,
} from '#components/NativeRouter';
import VideoCompositionRenderer from '#components/VideoCompositionRenderer';
import useToggle from '#hooks/useToggle';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import IconButton from '#ui/IconButton';
import coverDrawer from '../coverDrawer';
import { createParagraph } from '../coverDrawer/coverTextDrawer';
import { useCoverEditorContext, useCurrentLayer } from '../CoverEditorContext';
import {
  mediaInfoIsImage,
  percentRectToRect,
  isCoverDynamic,
  createCoverSkottieWithColorReplacement,
  createCoverVideoComposition,
  extractLottieInfoMemoized,
  MAX_DISPLAY_DECODER_RESOLUTION,
} from '../coverEditorHelpers';
import { BoundsEditorGestureHandler, drawBoundsEditor } from './BoundsEditor';
import { DynamicLinkRenderer } from './DynamicLinkRenderer';
import type { EditionParameters } from '#helpers/mediaEditions';
import type { ResizeHandlePosition } from './BoundsEditor';
import type { FrameDrawer } from '@azzapp/react-native-skia-video';
import type { SkRect } from '@shopify/react-native-skia';
import type {
  GestureResponderEvent,
  LayoutChangeEvent,
  LayoutRectangle,
  ViewProps,
} from 'react-native';

type CoverPreviewProps = Exclude<ViewProps, 'children'> & {
  /**
   * Width of the cover preview
   */
  width: number;
  /**
   * Height of the cover preview
   */
  height: number;
  /**
   * A callback to update the translation of the preview when the keyboard is displayed
   * this function must be a worklet
   *
   * @param translateY The translation to apply to the preview
   */
  onKeyboardTranslateWorklet: (translateY: number) => void;
  /**
   * A callback to open the links modal
   */
  onOpenLinksModal: () => void;
};

/**
 * Cover preview component
 * This component is used to display the cover in edition
 */
const CoverPreview = ({
  width: viewWidth,
  height: viewHeight,
  style,
  onKeyboardTranslateWorklet,
  onOpenLinksModal,
  ...props
}: CoverPreviewProps) => {
  // #region Data and state
  const { dispatch, coverEditorState } = useCoverEditorContext();
  const {
    lottie,
    coverTransition,
    medias,
    overlayLayers,
    textLayers,
    linksLayer,
    cardColors,
    images,
    videoPaths,
    lutShaders,
    loadingLocalMedia,
    loadingRemoteMedia,
    editionMode,
    selectedItemIndex: selectedLayerIndex,
  } = coverEditorState;

  /**
   * Whether the cover is dynamic (i.e. contains animations or multiple media items)
   * Non dynamic covers can be rendered as a single image, while dynamic covers require
   * a video.
   */
  const isDynamic = isCoverDynamic(coverEditorState);

  /**
   * Dependencies for the composition displayed in the preview
   * We need to limit as much as possible the recomputation of the composition
   * to avoid unnecessary re-renders of the preview (and recreation of the video decoder)
   */
  const compositionDependencies = [
    coverTransition,
    images,
    loadingLocalMedia,
    loadingRemoteMedia,
    isDynamic,
    medias
      .map(mediaInfo =>
        mediaInfoIsImage(mediaInfo)
          ? `${mediaInfo.media.uri}-${mediaInfo.duration}`
          : `${mediaInfo.media.uri}-${mediaInfo.timeRange.startTime}-${mediaInfo.timeRange.duration}`,
      )
      .join(''),
    videoPaths,
  ];

  /**
   * Video composition to display in the preview
   * The video scale is the result of the reduction of the video resolution
   * in the video decoder to avoid decoding videos at full resolution
   */
  const { composition, videoScales } = useMemo(() => {
    const allItemsLoaded = medias.every(
      ({ media }) =>
        (media.kind === 'image' && images[media.uri]) ||
        (media.kind === 'video' && videoPaths[media.uri]),
    );
    if (loadingLocalMedia || loadingRemoteMedia || !allItemsLoaded) {
      return { composition: null, videoScales: {} };
    }
    if (!isDynamic) {
      // a fake composition with a duration of 5 seconds to display a static image
      return {
        composition: { duration: COVER_IMAGE_DEFAULT_DURATION - 1, items: [] },
        videoScales: {},
      };
    }

    return createCoverVideoComposition(
      coverEditorState,
      MAX_DISPLAY_DECODER_RESOLUTION,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, compositionDependencies);

  /**
   * Active layer currently being edited
   */
  const activeLayer = useCurrentLayer();

  /**
   * Shared values to override bounds and rotation of the layer currently being edited
   * This allows to display in real-time the changes made by the user, without updating the state
   * too often.
   */
  const activeLayerBounds = useSharedValue<{
    bounds: SkRect;
    rotation: number;
  } | null>(null);
  /**
   * Shared value to override the font size of the text layer currently being edited
   * This allows to display in real-time the changes made by the user when scaling the text layer
   * without updating the state too often.
   */
  const editedTextFontSize = useSharedValue<number | null>(null);

  const previousActiveLayer = useRef(activeLayer);
  useEffect(() => {
    if (activeLayer !== previousActiveLayer.current) {
      previousActiveLayer.current = activeLayer;
      if (activeLayer.kind === 'overlay') {
        const layer = activeLayer.layer;
        activeLayerBounds.value = {
          bounds: layer.bounds,
          rotation: layer.rotation,
        };
      } else if (activeLayer.kind === 'text') {
        const layer = activeLayer.layer;
        const paragraph = createParagraph({
          layer,
          canvasWidth: viewWidth,
        });

        activeLayerBounds.value = {
          bounds: {
            x: layer.position.x,
            y: layer.position.y,
            width: layer.width,
            height: (paragraph.getHeight() * 100) / viewHeight,
          },
          rotation: layer.rotation,
        };
        editedTextFontSize.value = layer.fontSize;
      } else if (activeLayer.kind === 'links') {
        const layer = activeLayer.layer;

        const { width, height } = calculateLinksSize(
          layer.links.length,
          layer.size,
          {
            viewHeight,
            viewWidth,
          },
        );

        activeLayerBounds.value = {
          bounds: {
            x: layer.position.x,
            y: layer.position.y,
            width,
            height,
          },
          rotation: layer.rotation,
        };
      } else {
        activeLayerBounds.value = null;
        editedTextFontSize.value = null;
      }
    }
  }, [
    activeLayer,
    activeLayerBounds,
    editedTextFontSize,
    viewHeight,
    viewWidth,
    linksLayer.size,
    linksLayer.links.length,
  ]);
  // #endregion

  // #region Frame drawing
  const skottiePlayer = useMemo(
    () => createCoverSkottieWithColorReplacement(lottie, cardColors),
    [lottie, cardColors],
  );

  useEffect(() => () => skottiePlayer?.dispose(), [skottiePlayer]);

  const lottieInfo = extractLottieInfoMemoized(lottie);

  /**
   * The main function used to draw the frame of the cover in the preview
   */
  const drawFrame = useCallback<FrameDrawer>(
    infos => {
      'worklet';
      if (!lutShaders) {
        return;
      }
      let state = coverEditorState;
      if (activeLayerBounds.value) {
        const { bounds, rotation } = activeLayerBounds.value;
        if (
          state.editionMode === 'overlay' &&
          state.selectedItemIndex != null
        ) {
          state = {
            ...state,
            overlayLayers: state.overlayLayers.map((overlayLayer, i) => {
              if (i === state.selectedItemIndex) {
                return {
                  ...overlayLayer,
                  bounds,
                  rotation,
                  // We remove animation of overlay layer during edition
                  // to make it visibile to the user
                  animation: null,
                };
              }
              return overlayLayer;
            }),
          };
        } else if (
          state.editionMode === 'text' ||
          (state.editionMode === 'textEdit' && state.selectedItemIndex != null)
        ) {
          state = {
            ...state,
            textLayers: state.textLayers.map((textLayer, i) => {
              if (i === state.selectedItemIndex) {
                return {
                  ...textLayer,
                  width: bounds.width,
                  position: {
                    x: bounds.x,
                    y: bounds.y,
                  },
                  fontSize: editedTextFontSize.value ?? textLayer.fontSize,
                  rotation,
                  // We remove animation of text layer during edition
                  // to make it visibile to the user
                  animation: null,
                };
              }
              return textLayer;
            }),
          };
        }
      }
      if (editionMode === 'textEdit') {
        state = {
          ...state,
          textLayers: state.textLayers.filter(
            (_, i) => i !== selectedLayerIndex,
          ),
        };
      }

      coverDrawer({
        ...infos,
        coverEditorState: state,
        images,
        lutShaders,
        videoScales,
        skottiePlayer,
        lottieInfo,
      });

      if (activeLayerBounds.value) {
        drawBoundsEditor({
          ...infos,
          bounds: activeLayerBounds.value.bounds,
          rotation: activeLayerBounds.value.rotation,
          drawHandles: editionMode === 'overlay' || editionMode === 'text',
          handles:
            editionMode === 'overlay'
              ? ['top', 'bottom', 'left', 'right']
              : ['left', 'right'],
        });
      }
    },
    [
      lutShaders,
      lottieInfo,
      skottiePlayer,
      coverEditorState,
      activeLayerBounds,
      editionMode,
      images,
      videoScales,
      editedTextFontSize,
      selectedLayerIndex,
    ],
  );
  // #endregion

  // #region Layer selection and edition

  /**
   * Main callback to handle the press on the canvas
   * This will select the layer currently being pressed for edition
   * or deselect the current layer if the canvas is pressed outside of any layer
   */
  const handleCanvasPress = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;
      const canvasWidth = viewWidth;
      const canvasHeight = viewHeight;
      for (let i = textLayers.length - 1; i >= 0; i--) {
        const textLayer = textLayers[i];
        const { position, width: layerWidth, rotation } = textLayer;
        const paragraph = createParagraph({
          layer: textLayer,
          canvasWidth,
        });
        const bounds = percentRectToRect(
          {
            x: position.x,
            y: position.y,
            width: layerWidth,
            height: (paragraph.getHeight() * 100) / canvasHeight,
          },
          viewWidth,
          viewHeight,
        );
        if (inBounds(locationX, locationY, bounds, rotation)) {
          dispatch({
            type: 'SET_EDITION_MODE',
            payload: { editionMode: 'text', selectedItemIndex: i },
          });
          return;
        }
      }
      for (let i = overlayLayers.length - 1; i >= 0; i--) {
        const { bounds, rotation } = overlayLayers[i];
        if (
          inBounds(
            locationX,
            locationY,
            percentRectToRect(bounds, canvasWidth, canvasHeight),
            rotation,
          )
        ) {
          dispatch({
            type: 'SET_EDITION_MODE',
            payload: { editionMode: 'overlay', selectedItemIndex: i },
          });
          return;
        }
      }
      if (
        editionMode === 'overlay' ||
        editionMode === 'textEdit' ||
        editionMode === 'text' ||
        editionMode === 'links'
      ) {
        dispatch({
          type: 'SET_EDITION_MODE',
          payload:
            editionMode === 'textEdit'
              ? { editionMode: 'text', selectedItemIndex: selectedLayerIndex }
              : { editionMode: 'none', selectedItemIndex: null },
        });
      }
    },
    [
      dispatch,
      editionMode,
      viewHeight,
      overlayLayers,
      selectedLayerIndex,
      textLayers,
      viewWidth,
    ],
  );

  // #region Layer edition gestures handling
  /** offset of the gesture when starting the edition of a layer */
  const gestureOffset = useSharedValue(activeLayerBounds.value);
  /**
   * Callback to handle the start of a gesture on a layer
   */
  const handleLayerGestureStart = useCallback(() => {
    'worklet';
    gestureOffset.value = activeLayerBounds.value;
  }, [activeLayerBounds.value, gestureOffset]);

  /**
   * Callback to handle the translation of the layer currently being edited
   */
  const handleLayerPan = useCallback(
    (translateX: number, translateY: number) => {
      'worklet';
      if (!activeLayerBounds.value || !gestureOffset.value) {
        return;
      }
      const canvasWidth = viewWidth;
      const canvasHeight = viewHeight;
      const { bounds, rotation } = activeLayerBounds.value;
      const { x: offsetX, y: offsetY } = gestureOffset.value.bounds;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      const boundingBoxWidth =
        ((Math.abs(((bounds.width * canvasWidth) / 100) * cos) +
          Math.abs(((bounds.height * canvasHeight) / 100) * sin)) /
          canvasWidth) *
        100;
      const boundingBoxHeight =
        ((Math.abs(((bounds.height * canvasHeight) / 100) * cos) +
          Math.abs(((bounds.width * canvasWidth) / 100) * sin)) /
          canvasHeight) *
        100;
      activeLayerBounds.value = {
        bounds: {
          x: clamp(
            offsetX + (translateX * 100) / canvasWidth,
            boundingBoxWidth / 2,
            100 - boundingBoxWidth / 2,
          ),
          y: clamp(
            offsetY + (translateY * 100) / canvasHeight,
            boundingBoxHeight / 2,
            100 - boundingBoxHeight / 2,
          ),
          width: bounds.width,
          height: bounds.height,
        },
        rotation,
      };
    },
    [activeLayerBounds, gestureOffset.value, viewHeight, viewWidth],
  );

  /**
   * Callback to handle the scaling of the layer currently being edited
   */
  const handleLayerScale = useCallback(
    (scale: number) => {
      'worklet';
      if (!activeLayerBounds.value || !gestureOffset.value) {
        return;
      }
      const { rotation } = activeLayerBounds.value;
      if (activeLayer.kind === 'text') {
        const { x, y, width: offsetWidth } = gestureOffset.value.bounds;
        const layer = activeLayer.layer;
        const layerWidth = clamp(offsetWidth * scale, 20, 90);
        const fontSize = Math.round(clamp(layer.fontSize * scale, 10, 48));
        editedTextFontSize.value = fontSize;
        const paragraph = createParagraph({
          layer: {
            ...layer,
            fontSize,
            width: layerWidth,
          },
          canvasWidth: viewWidth,
        });
        const layerHeight = (paragraph.getHeight() * 100) / viewHeight;
        activeLayerBounds.value = {
          bounds: {
            x,
            y,
            width: layerWidth,
            height: layerHeight,
          },
          rotation,
        };
      } else {
        const { bounds } = gestureOffset.value;
        const scaledWidth = clamp(bounds.width * scale, 20, 100);
        const scaledHeight = clamp(bounds.height * scale, 20, 100);
        activeLayerBounds.value = {
          bounds: {
            x: bounds.x,
            y: bounds.y,
            width: scaledWidth,
            height: scaledHeight,
          },
          rotation,
        };
      }
    },
    [
      activeLayer,
      activeLayerBounds,
      editedTextFontSize,
      gestureOffset,
      viewHeight,
      viewWidth,
    ],
  );

  /**
   * Callback to handle the rotation of the layer currently being edited
   */
  const handleLayerRotate = useCallback(
    (rotation: number) => {
      'worklet';
      if (!activeLayerBounds.value || !gestureOffset.value) {
        return;
      }
      const { bounds } = activeLayerBounds.value;
      const { rotation: initialRotation } = gestureOffset.value;
      let newRotation = initialRotation + rotation;
      const diffWithRightAngle = newRotation % (Math.PI / 2);
      if (Math.abs(diffWithRightAngle) < Math.PI / 20) {
        newRotation -= diffWithRightAngle;
      }
      activeLayerBounds.value = {
        bounds,
        rotation: newRotation,
      };
    },
    [activeLayerBounds, gestureOffset.value],
  );

  /**
   * Callback to handle the resizing of the layer currently being edited
   */
  const handleLayerResize = useCallback(
    (position: ResizeHandlePosition, valueX: number, valueY: number) => {
      'worklet';
      if (!gestureOffset.value || !activeLayerBounds.value) {
        return;
      }
      // Get the rotation angle of the object
      const rotationAngle = activeLayerBounds.value.rotation;

      // Calculate the changes in the rotated coordinate system
      const rotatedValueX =
        valueX * Math.cos(-rotationAngle) - valueY * Math.sin(-rotationAngle);
      const rotatedValueY =
        valueX * Math.sin(-rotationAngle) + valueY * Math.cos(-rotationAngle);

      const {
        x: offsetX,
        y: offsetY,
        width: offsetWidth,
        height: offsetHeight,
      } = gestureOffset.value.bounds;
      let value =
        position === 'top' || position === 'bottom'
          ? (rotatedValueY * 100) / viewHeight
          : (rotatedValueX * 100) / viewWidth;

      let newBounds: SkRect;
      switch (position) {
        case 'top': {
          value = clamp(value, -offsetY, offsetHeight - 20);
          newBounds = {
            x: offsetX,
            y: offsetY,
            width: offsetWidth,
            height: offsetHeight - value,
          };
          break;
        }
        case 'bottom':
          value = clamp(value, -offsetHeight - 20, offsetY);
          newBounds = {
            x: offsetX,
            y: offsetY,
            width: offsetWidth,
            height: offsetHeight + value,
          };
          break;
        case 'left':
          value = clamp(value, -offsetX, offsetWidth - 20);
          newBounds = {
            x: offsetX,
            y: offsetY,
            width: offsetWidth - value,
            height: offsetHeight,
          };
          break;
        case 'right':
          value = clamp(value, -offsetWidth - 20, offsetX);
          newBounds = {
            x: offsetX,
            y: offsetY,
            width: offsetWidth + value,
            height: offsetHeight,
          };
          break;
      }
      if (activeLayer.kind === 'text') {
        const paragraph = createParagraph({
          layer: { ...activeLayer.layer, width: newBounds.width },
          canvasWidth: viewWidth,
        });
        newBounds = {
          ...newBounds,
          height: (paragraph.getHeight() * 100) / viewHeight,
        };
      }
      activeLayerBounds.value = {
        bounds: newBounds,
        rotation: activeLayerBounds.value.rotation,
      };
    },
    [
      activeLayer.kind,
      activeLayer.layer,
      activeLayerBounds,
      gestureOffset.value,
      viewHeight,
      viewWidth,
    ],
  );

  /**
   * Dispatch the result of a gesture on a layer
   */
  const dispatchGestureResult = useCallback(() => {
    if (!activeLayerBounds.value) {
      return;
    }
    const { bounds, rotation } = activeLayerBounds.value;
    runOnJS(() => {
      if (activeLayer.kind === 'overlay') {
        dispatch({
          type: 'UPDATE_OVERLAY_LAYER',
          payload: {
            bounds,
            rotation,
          },
        });
      } else if (activeLayer.kind === 'text') {
        const fontSize = editedTextFontSize.value ?? activeLayer.layer.fontSize;
        dispatch({
          type: 'UPDATE_TEXT_LAYER',
          payload: {
            position: {
              x: bounds.x,
              y: bounds.y,
            },
            width: bounds.width,
            fontSize,
            rotation,
          },
        });
      }
      if (activeLayer.kind === 'links') {
        dispatch({
          type: 'UPDATE_LINKS_LAYER',
          payload: {
            position: {
              x: bounds.x,
              y: bounds.y,
            },
            rotation,
          },
        });
      }
    })();
  }, [activeLayer, activeLayerBounds, dispatch, editedTextFontSize]);

  /**
   * Callback to handle the end of a gesture on a layer
   */
  const handleLayerGestureEnd = useCallback(() => {
    'worklet';
    // we need to define the function outside of the worklet to avoid reanimated error
    runOnJS(dispatchGestureResult)();
  }, [dispatchGestureResult]);

  /**
   * The position of the gesture handler used to capture the gestures
   * on the layer currently being edited
   */
  const gestureHandlerPosition = useDerivedValue(() => {
    if (activeLayerBounds.value) {
      const { bounds } = activeLayerBounds.value;
      return {
        bounds: percentRectToRect(bounds, viewWidth, viewHeight),
        rotation: activeLayerBounds.value.rotation,
      };
    }
    return null;
  });

  /**
   * Styles for the buttons to control the layer currently being edited
   * (inverse the rotation)
   */
  const controlsButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${-(activeLayerBounds.value?.rotation ?? 0)}rad`,
        },
      ],
    };
  });

  /**
   * Callback to handle the press on the links layer
   * This will select the links layer for edition
   */
  const handleLinksPress = useCallback(() => {
    dispatch({
      type: 'SET_EDITION_MODE',
      payload: {
        selectedItemIndex: null,
        editionMode: 'links',
      },
    });
  }, [dispatch]);

  /**
   * Callback to delete the layer currently being edited
   */
  const handleDeleteCurrentLayer = useCallback(() => {
    dispatch({ type: 'DELETE_CURRENT_LAYER' });
  }, [dispatch]);
  // #endregion

  // #region Image overlay edition
  const [showOverlayCropper, toggleShowOverlayCropper] = useToggle(false);
  const onOverlayCropSave = (editionParameters: EditionParameters) => {
    dispatch({
      type: 'UPDATE_MEDIA_EDITION_PARAMETERS',
      payload: editionParameters,
    });
    toggleShowOverlayCropper();
  };
  // #endregion

  // #region Text edition
  const inputRef = useRef<TextInput | null>(null);
  /**
   * Callback to handle the edition of a text layer
   * This will select the text layer for edition and focus the text input
   */
  const handleTextLayerEdit = useCallback(() => {
    if (selectedLayerIndex == null) {
      return;
    }
    dispatch({
      type: 'SET_EDITION_MODE',
      payload: {
        editionMode: 'textEdit',
        selectedItemIndex: selectedLayerIndex,
      },
    });
  }, [dispatch, selectedLayerIndex]);

  const oldEditionMode = useRef(editionMode);
  useEffect(() => {
    if (
      editionMode === 'textEdit' &&
      oldEditionMode.current !== 'textEdit' &&
      selectedLayerIndex != null
    ) {
      const length = textLayers[selectedLayerIndex].text?.length ?? 0;
      // Since the TextInput is not displayed yet, we need to wait a bit before focusing it
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelection(0, length);
      }, 10);
    }
    oldEditionMode.current = editionMode;
  }, [editionMode, selectedLayerIndex, textLayers]);

  /**
   * Callback to handle text changes in the text input
   */
  const handleChangeText = useCallback(
    (text: string) => {
      if (selectedLayerIndex != null) {
        dispatch({
          type: 'UPDATE_TEXT_LAYER',
          payload: { text },
        });
      }
    },
    [dispatch, selectedLayerIndex],
  );

  /**
   * The text layer currently being edited
   */
  const editedTextLayer =
    editionMode === 'textEdit' && selectedLayerIndex != null
      ? (textLayers[selectedLayerIndex] ?? null)
      : null;

  /**
   * Animated style for the text input
   * This will update the position and the size of the text input based on the bounds of the text layer
   * currently being edited
   */
  const animatedTextInputStyle = useAnimatedStyle(() => {
    if (activeLayerBounds.value) {
      const { bounds, rotation } = activeLayerBounds.value;
      const fontSize =
        editedTextFontSize.value ?? editedTextLayer?.fontSize ?? 14;
      const width = (bounds.width * viewWidth) / 100;
      const height = (bounds.height * viewHeight) / 100;

      return {
        top: (bounds.y * viewHeight) / 100 - height / 2,
        left: (bounds.x * viewWidth) / 100 - width / 2,
        width,
        fontSize: convertToBaseCanvasRatio(fontSize, viewWidth),
        transform: [{ rotate: `${rotation}rad` }],
      };
    }
    if (editedTextLayer) {
      return {
        top: (editedTextLayer.position.y * viewHeight) / 100,
        left: (editedTextLayer.position.x * viewWidth) / 100,
        width: (editedTextLayer.width * viewWidth) / 100,
        transform: [{ rotate: `${editedTextLayer.rotation}rad` }],
      };
    }
    return { top: 0, left: 0 };
  });
  // #endregion

  // #region Keyboard handling

  //##############################################################################
  //#
  //# This whole section is used to compute the translation of the
  //# preview when the keyboard is displayed  to place the text input
  //# in the center of the remaining space of the screen
  //#
  //##############################################################################

  const {
    height: keyboardHeightSharedValue,
    progress: keyboardProgressSharedValue,
  } = useReanimatedKeyboardAnimation();
  const { height: windowHeight } = useWindowDimensions();
  const pageYSharedValue = useSharedValue(0);
  const inputSize = useSharedValue<LayoutRectangle | null>(null);

  const containerRef = useCallback(
    (ref: View | null) => {
      ref?.measureInWindow((_, y) => {
        pageYSharedValue.value = y;
      });
    },
    [pageYSharedValue],
  );

  const handleTextInputLayout = useCallback(
    (event: LayoutChangeEvent) => {
      inputSize.value = event.nativeEvent.layout;
    },
    [inputSize],
  );
  useAnimatedReaction(
    () =>
      [
        inputSize.value,
        pageYSharedValue.value,
        keyboardProgressSharedValue.value,
        keyboardHeightSharedValue.value,
      ] as const,
    ([inputSize, pageY, keyboardProgress, keyboardHeight]) => {
      if (!inputSize) {
        onKeyboardTranslateWorklet(0);
        return;
      }
      const { y, height } = inputSize;
      const editionInputCenter = pageY + y + height / 2;
      //we need a local variable to avoid keyboard issue
      const res = interpolate(
        keyboardProgress,
        [0, 1],
        [
          0,
          (Platform.OS === 'android' ? keyboardHeight / 2 : keyboardHeight) +
            windowHeight / 2 -
            editionInputCenter,
        ],
      );
      return onKeyboardTranslateWorklet(res);
    },
  );
  // #endregion

  // #region Screen shot replacement
  const hasFocus = useScreenHasFocus();
  const compositionContainerRef = useRef<View | null>(null);
  const [snapshotId, setSnapshotId] = useState<string | null>(null);
  const currentScreenShot = useRef<string | null>(null);
  useModalInterceptor(async () => {
    let screenShotId: string | null;
    if (!compositionContainerRef.current) {
      return;
    }
    if (
      (lottieInfo?.assetsInfos.length ?? 1) > coverEditorState.medias.length
    ) {
      return;
    }
    try {
      screenShotId = await captureSnapshot(compositionContainerRef.current);
    } catch (e) {
      console.log('error', e);
      screenShotId = null;
    }
    currentScreenShot.current = screenShotId;
    setSnapshotId(screenShotId);
    await waitTime(10);
  });

  useEffect(() => {
    if (hasFocus) {
      setSnapshotId(null);
    }
  }, [hasFocus]);
  // #endregion

  const animatedLinksStyle = useAnimatedStyle(() => {
    if (activeLayerBounds.value && activeLayer.kind === 'links') {
      const { bounds, rotation } = activeLayerBounds.value;

      const width = (bounds.width * viewWidth) / 100;
      const height = (bounds.height * viewHeight) / 100;

      const top = (bounds.y * viewHeight) / 100 - height / 2;
      const left = (bounds.x * viewWidth) / 100 - width / 2;

      return {
        top,
        left,
        // width: bounds.width * viewWidth,
        transform: [{ rotate: `${rotation}rad` }],
      };
    }

    const { height, width } = calculateLinksSize(
      linksLayer.links.length,
      linksLayer.size,
      {
        viewHeight,
        viewWidth,
      },
    );

    const calculatedWith = (width * viewWidth) / 100;
    const calculatedHeight = (height * viewHeight) / 100;

    return {
      top: (linksLayer.position.y * viewHeight) / 100 - calculatedHeight / 2,
      left: (linksLayer.position.x * viewWidth) / 100 - calculatedWith / 2,
    };
  });

  const restorePositionOnMountRef = useRef(-1);

  return (
    <>
      <View
        style={[
          style,
          styles.root,
          {
            width: viewWidth,
            height: viewHeight,
            borderRadius: COVER_CARD_RADIUS * viewWidth,
          },
        ]}
      >
        <View
          ref={containerRef}
          style={[
            style,
            {
              borderRadius: COVER_CARD_RADIUS * viewWidth,
              width: viewWidth,
              height: viewHeight,
              overflow: 'hidden',
            },
          ]}
          {...props}
        >
          {/* Not rendering when modal are displayed reduce memory usage */}
          {loadingRemoteMedia || (!hasFocus && !snapshotId) ? (
            <Container style={styles.loadingContainer}>
              <ActivityIndicator />
            </Container>
          ) : (
            <View
              ref={compositionContainerRef}
              style={{ width: viewWidth, height: viewHeight }}
              collapsable={false}
            >
              {snapshotId && (
                <SnapshotRenderer
                  snapshotID={snapshotId}
                  style={{ width: viewWidth, height: viewHeight }}
                />
              )}
              {hasFocus && (
                <VideoCompositionRenderer
                  pause={
                    editionMode === 'textEdit' ||
                    editionMode === 'text' ||
                    editionMode === 'overlay'
                  }
                  composition={composition}
                  width={viewWidth}
                  height={viewHeight}
                  drawFrame={drawFrame}
                  restorePositionOnMountRef={restorePositionOnMountRef}
                />
              )}
              <Pressable
                style={{
                  width: viewWidth,
                  height: viewHeight,
                  position: 'absolute',
                }}
                onPress={handleCanvasPress}
              >
                <AnimatedPressable
                  style={[
                    {
                      position: 'absolute',
                      transformOrigin: 'center',
                      transform: [{ rotate: `${linksLayer.rotation}rad` }],
                      top: (linksLayer.position.y * viewHeight) / 100,
                      left: (linksLayer.position.x * viewWidth) / 100,
                      display: 'flex',
                      flexDirection: 'row',
                      gap: convertToBaseCanvasRatio(LINKS_GAP, viewWidth),
                    },
                    animatedLinksStyle,
                  ]}
                  onPress={handleLinksPress}
                  pointerEvents="box-none"
                >
                  {linksLayer.links.map(link => (
                    <DynamicLinkRenderer
                      key={link.socialId}
                      as={View}
                      cardColors={cardColors}
                      color={linksLayer.color}
                      link={link}
                      shadow={linksLayer.shadow}
                      size={linksLayer.size}
                      viewWidth={viewWidth}
                    />
                  ))}
                </AnimatedPressable>

                {activeLayer.kind === 'overlay' &&
                  editionMode !== 'textEdit' && (
                    <BoundsEditorGestureHandler
                      position={gestureHandlerPosition}
                      onGestureStart={handleLayerGestureStart}
                      onGestureEnd={handleLayerGestureEnd}
                      onPan={handleLayerPan}
                      onPinch={handleLayerScale}
                      onRotate={handleLayerRotate}
                      onResize={handleLayerResize}
                      handles={['top', 'bottom', 'left', 'right']}
                    >
                      <View style={styles.overlayControls}>
                        <IconButton
                          icon="crop"
                          style={[styles.controlsButton, controlsButtonStyle]}
                          iconStyle={styles.controlsButtonIcon}
                          onPress={toggleShowOverlayCropper}
                          iconSize={20}
                          size={CONTROLS_BUTTON_HEIGHT}
                          hitSlop={iconHitSlop}
                        />
                        <IconButton
                          icon="trash_line"
                          style={[styles.controlsButton, controlsButtonStyle]}
                          iconStyle={styles.controlsButtonIcon}
                          onPress={handleDeleteCurrentLayer}
                          iconSize={CONTROLS_BUTTON_ICON_SIZE}
                          size={CONTROLS_BUTTON_HEIGHT}
                          hitSlop={iconHitSlop}
                        />
                      </View>
                    </BoundsEditorGestureHandler>
                  )}

                {activeLayer.kind === 'text' && editionMode !== 'textEdit' && (
                  <BoundsEditorGestureHandler
                    position={gestureHandlerPosition}
                    onGestureStart={handleLayerGestureStart}
                    onGestureEnd={handleLayerGestureEnd}
                    onPan={handleLayerPan}
                    onPinch={handleLayerScale}
                    onRotate={handleLayerRotate}
                    onResize={handleLayerResize}
                    handles={['left', 'right']}
                  >
                    <View style={styles.textControls}>
                      <IconButton
                        icon="trash_line"
                        style={[styles.controlsButton, controlsButtonStyle]}
                        iconStyle={styles.controlsButtonIcon}
                        onPress={handleDeleteCurrentLayer}
                        iconSize={CONTROLS_BUTTON_ICON_SIZE}
                        size={CONTROLS_BUTTON_HEIGHT}
                        hitSlop={iconHitSlop}
                      />
                      <IconButton
                        icon="edit"
                        style={[styles.controlsButton, controlsButtonStyle]}
                        iconStyle={styles.controlsButtonIcon}
                        onPress={handleTextLayerEdit}
                        iconSize={CONTROLS_BUTTON_ICON_SIZE}
                        size={CONTROLS_BUTTON_HEIGHT}
                        hitSlop={iconHitSlop}
                      />
                    </View>
                  </BoundsEditorGestureHandler>
                )}

                {activeLayer.kind === 'links' &&
                  linksLayer.links.length > 0 &&
                  editionMode !== 'textEdit' && (
                    <BoundsEditorGestureHandler
                      position={gestureHandlerPosition}
                      onGestureStart={handleLayerGestureStart}
                      onGestureEnd={handleLayerGestureEnd}
                      onPan={handleLayerPan}
                      handles={[]}
                    >
                      <View style={styles.linksControls}>
                        <IconButton
                          icon="trash_line"
                          style={[styles.controlsButton, controlsButtonStyle]}
                          iconStyle={styles.controlsButtonIcon}
                          onPress={handleDeleteCurrentLayer}
                          iconSize={CONTROLS_BUTTON_ICON_SIZE}
                          size={CONTROLS_BUTTON_HEIGHT}
                          hitSlop={iconHitSlop}
                        />
                        <IconButton
                          icon="edit"
                          style={[styles.controlsButton, controlsButtonStyle]}
                          iconStyle={styles.controlsButtonIcon}
                          onPress={onOpenLinksModal}
                          iconSize={CONTROLS_BUTTON_ICON_SIZE}
                          size={CONTROLS_BUTTON_HEIGHT}
                          hitSlop={iconHitSlop}
                        />
                      </View>
                    </BoundsEditorGestureHandler>
                  )}
                {editedTextLayer && (
                  <AnimatedTextInput
                    ref={inputRef}
                    onLayout={handleTextInputLayout}
                    value={editedTextLayer.text ?? ''}
                    multiline
                    blurOnSubmit
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      dispatch({
                        type: 'SET_EDITION_MODE',
                        payload: {
                          editionMode: 'text',
                          selectedItemIndex: selectedLayerIndex,
                        },
                      });
                    }}
                    style={[
                      {
                        position: 'absolute',
                        fontFamily: editedTextLayer.fontFamily,
                        color:
                          swapColor(editedTextLayer.color, cardColors) ??
                          '#000',
                        fontSize: convertToBaseCanvasRatio(
                          editedTextLayer.fontSize,
                          viewWidth,
                        ),
                        transformOrigin: 'center',
                        transform: [
                          { rotate: `${editedTextLayer.rotation}rad` },
                        ],
                        textAlign: editedTextLayer.textAlign,
                        padding: 0,
                        top: (editedTextLayer.position.y * viewHeight) / 100,
                        left: (editedTextLayer.position.x * viewWidth) / 100,
                        width: (editedTextLayer.width * viewWidth) / 100,
                      },
                      animatedTextInputStyle,
                    ]}
                    onChangeText={handleChangeText}
                    scrollEnabled={false}
                    allowFontScaling={false}
                  />
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
      {activeLayer.kind === 'overlay' && (
        <ScreenModal
          visible={showOverlayCropper}
          animationType="slide"
          onRequestDismiss={toggleShowOverlayCropper}
        >
          <ImagePicker
            initialData={activeLayer.layer}
            additionalData={{
              selectedParameter: 'cropData',
              selectedTab: 'edit',
              showTabs: false,
              onEditionSave: onOverlayCropSave,
              onEditionCancel: toggleShowOverlayCropper,
            }}
            forceAspectRatio={
              (activeLayer.layer.bounds.width /
                activeLayer.layer.bounds.height) *
              COVER_RATIO
            }
            steps={[EditImageStep]}
            onCancel={toggleShowOverlayCropper}
          />
        </ScreenModal>
      )}
    </>
  );
};

export default CoverPreview;

const iconHitSlop = {
  top: 3,
  bottom: 3,
  left: 3,
  right: 3,
};

const CONTROLS_BUTTON_ICON_SIZE = 20;
const CONTROLS_BUTTON_HEIGHT = 30;
const OVERLAY_CONTROLS_MARGIN = 20;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const inBounds = (
  x: number,
  y: number,
  bounds: SkRect,
  rotation: number,
): boolean => {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const boundingBoxWidth =
    Math.abs(bounds.width * cos) + Math.abs(bounds.height * sin);
  const boundingBoxHeight =
    Math.abs(bounds.height * cos) + Math.abs(bounds.width * sin);

  return (
    x >= bounds.x - boundingBoxWidth / 2 &&
    x <= bounds.x + boundingBoxWidth / 2 &&
    y >= bounds.y - boundingBoxHeight / 2 &&
    y <= bounds.y + boundingBoxHeight / 2
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.grey300,
    ...shadow('light'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayControls: {
    gap: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    top: -CONTROLS_BUTTON_HEIGHT - OVERLAY_CONTROLS_MARGIN,
    left: 0,
    width: '100%',
    height: CONTROLS_BUTTON_HEIGHT,
    pointerEvents: 'box-none',
  },
  textControls: {
    justifyContent: 'space-between',
    position: 'absolute',
    top: -CONTROLS_BUTTON_HEIGHT,
    bottom: -CONTROLS_BUTTON_HEIGHT,
    right: -CONTROLS_BUTTON_HEIGHT,
    pointerEvents: 'box-none',
  },
  linksControls: {
    justifyContent: 'space-between',
    position: 'absolute',
    top: -CONTROLS_BUTTON_HEIGHT,
    bottom: -CONTROLS_BUTTON_HEIGHT,
    right: -CONTROLS_BUTTON_HEIGHT,
    pointerEvents: 'box-none',
  },
  controlsButton: {
    marginHorizontal: 5,
    backgroundColor: colors.black,
    borderColor: colors.white,
    borderWidth: 2,
    transformOrigin: 'center',
  },
  controlsButtonIcon: {
    tintColor: colors.white,
  },
});
