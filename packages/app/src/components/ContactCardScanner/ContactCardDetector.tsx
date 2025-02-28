import { makeImageFromView } from '@shopify/react-native-skia';
import { Paths, File } from 'expo-file-system/next';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { useCallback, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { useCameraDevice, Camera } from 'react-native-vision-camera';
import { graphql, useMutation } from 'react-relay';
import { colors } from '#theme';
import ImagePicker, { SelectImageStep } from '#components/ImagePicker';
import { ScreenModal } from '#components/NativeRouter';
import PermissionModal from '#components/PermissionModal';
import useBoolean from '#hooks/useBoolean';
import useIsForeground from '#hooks/useIsForeground';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import IconButton from '#ui/IconButton';
import Text from '#ui/Text';
import UploadProgressModal from '#ui/UploadProgressModal';
import type { ImagePickerResult } from '#components/ImagePicker';
import type {
  ContactCardDetectorMutation,
  ContactCardDetectorMutation$data,
} from '#relayArtifacts/ContactCardDetectorMutation.graphql';
import type { Point } from 'react-native-vision-camera';

const horizontal = require('./assets/orientation_horizontal.png');
const vertical = require('./assets/orientation_vertical.png');

type ContactCardDetectorProps = {
  close: () => void;
  extractData: (
    data: ContactCardDetectorMutation$data['extractVisitCardData'],
    image: { uri: string; aspectRatio: number },
  ) => void;
};

const ContactCardDetector = ({
  close,
  extractData,
}: ContactCardDetectorProps) => {
  const isActive = useIsForeground();
  const intl = useIntl();
  const device = useCameraDevice('back');

  const camera = useRef<Camera>(null);
  const [loading, showLoading, closeLoading] = useBoolean(false);
  const [isHorizontal, setHorizontal, setVertical] = useBoolean(true);
  const [isCameraMode, setCameraMode, setGalleryMode] = useBoolean(true);
  const [imageGallery, setImageGallery] = useState<ImagePickerResult | null>(
    null,
  );
  const [showPermission, , closePermission] = useBoolean(true);
  const [showPicker, openPicker, closePicker] = useBoolean(false);
  const { width, height } = useScreenDimensions();
  const { bottom, top } = useScreenInsets();

  const boxDimension: { width: number; height: number; x: number; y: number } =
    useMemo(() => {
      let currentWidth = width - 40;
      let currentHeight = currentWidth * SCAN_AREA_RATIO;
      if (!isHorizontal) {
        currentWidth = width - 140;
        currentHeight = currentWidth / SCAN_AREA_RATIO;
      }
      return {
        width: currentWidth,
        height: currentHeight,
        x: (width - currentWidth) / 2,
        y: (height - currentHeight) / 2,
      };
    }, [isHorizontal, width, height]);

  const [commit] = useMutation<ContactCardDetectorMutation>(graphql`
    mutation ContactCardDetectorMutation($imgUrl: String!) {
      extractVisitCardData(imgUrl: $imgUrl) {
        addresses
        company
        emails
        firstName
        lastName
        phoneNumbers
        title
        urls
      }
    }
  `);

  const takePicture = useCallback(async () => {
    if (!camera.current || !isActive) {
      return null;
    }
    showLoading();
    try {
      const photo = await camera.current.takePhoto();
      const isLandscape = photo.width > photo.height;
      const imageWidth = isLandscape ? photo.height : photo.width;
      const imageHeight = isLandscape ? photo.width : photo.height;

      const heightRatio = imageHeight / height;
      const adaptedScreenWidth = (imageWidth * height) / imageHeight;
      // Crop the image to the box dimensions / depreacted but I don't want to use a hook ...inside my function
      const croppedImage = await manipulateAsync(
        photo.path,
        [
          {
            crop: {
              originX:
                (boxDimension.x + (adaptedScreenWidth - width) / 2) *
                heightRatio,
              originY: boxDimension.y * heightRatio,
              width: boxDimension.width * heightRatio,
              height: boxDimension.height * heightRatio,
            },
          },
        ],
        { compress: 0.8, format: SaveFormat.JPEG, base64: true },
      );

      commit({
        variables: { imgUrl: `data:image/jpg;base64,${croppedImage.base64}` },
        onCompleted: data => {
          extractData(data.extractVisitCardData, {
            uri: croppedImage.uri,
            aspectRatio: croppedImage.width / croppedImage.height,
          });
          close();
          closeLoading();
        },
        onError: () => {},
      });
    } catch (error) {
      closeLoading();
      console.log(error);
    }
  }, [
    boxDimension.height,
    boxDimension.width,
    boxDimension.x,
    boxDimension.y,
    close,
    closeLoading,
    commit,
    extractData,
    height,
    isActive,
    showLoading,
    width,
  ]);

  const focus = useCallback((point: Point) => {
    const c = camera.current;
    if (c == null) return;
    c.focus(point);
  }, []);

  const gesture = Gesture.Tap()
    .enabled(isCameraMode)
    .onEnd(({ x, y }) => {
      runOnJS(focus)({ x, y });
    });

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  // Refs to store the final state after each gesture
  const initialScale = useSharedValue(1);
  const initialTx = useSharedValue(0);
  const initialTy = useSharedValue(0);
  const initialRotation = useSharedValue(0);

  // Pinch gesture handler
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      initialScale.value = scale.value;
    })
    .onUpdate(event => {
      scale.value = initialScale.value * event.scale;
    })
    .onEnd(() => {
      initialScale.value = scale.value;
    });

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .onStart(() => {
      //we need here to store the initial value of the translation (can ben different than 0 when loading an image gallery)
      initialTx.value = translateX.value;
      initialTy.value = translateY.value;
    })
    .onUpdate(event => {
      translateX.value = initialTx.value + event.translationX;
      translateY.value = initialTy.value + event.translationY;
    })
    .onEnd(() => {
      //we also need to save it here at the end
      initialTx.value = translateX.value;
      initialTy.value = translateY.value;
    });

  // Rotation gesture handler
  const rotationGesture = Gesture.Rotation()
    .onStart(() => {
      initialRotation.value = rotation.value;
    })
    .onUpdate(event => {
      rotation.value = initialRotation.value + event.rotation; // Apply scaling relative to the saved scale
    })
    .onEnd(() => {
      initialRotation.value = rotation.value; // Save the final scale value
    });

  // Combine all gestures to work simultaneously
  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    rotationGesture,
  );

  const onSelectImage = useCallback(
    (params: ImagePickerResult) => {
      translateX.value = 0;
      translateY.value = 0;
      scale.value = 1;
      rotation.value = 0;
      //resize width and height to fit the screen dimension, portrait use height screen dimension, landscape use width screen dimension
      const imageSize =
        params.aspectRatio > 1
          ? { width, height: width / params.aspectRatio }
          : { width: height * params.aspectRatio, height };
      setImageGallery({ ...params, ...imageSize });
      setGalleryMode();
      closePicker();
    },
    [
      closePicker,
      height,
      rotation,
      scale,
      setGalleryMode,
      translateX,
      translateY,
      width,
    ],
  );

  const extractDataFromGalleryMedia = useCallback(async () => {
    try {
      showLoading();
      const image = await makeImageFromView(ref);
      if (image) {
        const pngData = image.encodeToBytes(3, 100);
        const base64Data = image.encodeToBase64(3, 100);

        // Create a file path
        const timestamp = Date.now();
        const filePath = `${Paths.cache.uri}/${timestamp}.png`;

        // Write the byte array to a file
        const file = new File(filePath);
        await file.create();
        await file.write(pngData);

        commit({
          variables: { imgUrl: `data:image/jpg;base64,${base64Data}` },
          onCompleted: data => {
            extractData(data.extractVisitCardData, {
              uri: filePath,
              aspectRatio: image.width() / image.height(),
            });
            close();
            closeLoading();
          },
          onError: () => {
            closeLoading();
          },
        });
      }
    } catch (error) {
      closeLoading();
      console.log(error);
    }
  }, [close, closeLoading, commit, extractData, showLoading]);

  const ref = useRef<View>(null);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height,
      width,
      transform: [
        { translateX: -boxDimension.x + translateX.value },
        { translateY: -boxDimension.y + translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}rad` },
      ],
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={[styles.container, { width, height }]}>
        {isCameraMode && device && isActive ? (
          <Camera
            ref={camera}
            style={{ width, height }}
            device={device}
            isActive={isActive}
            photo
            video={false}
            androidPreviewViewType="surface-view"
            outputOrientation="device"
          />
        ) : (
          <View
            ref={ref}
            style={{
              position: 'absolute',
              top: boxDimension.y,
              left: boxDimension.x,
              width: boxDimension.width,
              height: boxDimension.height,
              borderRadius: BORDER_RADIUS,
            }}
            collapsable={false}
          >
            <Animated.View style={[animatedStyle, styles.containerImage]}>
              <Image
                source={{ uri: imageGallery?.uri }}
                style={{
                  height: imageGallery?.height,
                  width: imageGallery?.width,
                }}
              />
            </Animated.View>
          </View>
        )}
        <View
          style={[
            StyleSheet.absoluteFill,
            { pointerEvents: isCameraMode ? 'box-none' : 'none' },
          ]}
        >
          <GestureDetector gesture={gesture}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <Mask id="mask" x="0" y="0" width="100%" height="100%">
                  <Rect height="100%" width="100%" fill="white" />
                  <Rect
                    {...boxDimension}
                    fill="black"
                    rx={BORDER_RADIUS}
                    ry={BORDER_RADIUS}
                  />
                </Mask>
              </Defs>
              <Rect
                height="100%"
                width="100%"
                fill="black"
                mask="url(#mask)"
                fillOpacity="0.6"
              />
            </Svg>
          </GestureDetector>
          <Text
            variant="medium"
            style={[
              styles.whiteText,
              {
                color: 'white',
                top: boxDimension.y - 40,
                width,
                textAlign: 'center',
              },
            ]}
          >
            <FormattedMessage
              defaultMessage="Make sure all of the information is in the frame"
              description="ContactCardDetector - information for scanning card"
            />
          </Text>
        </View>
        <View style={StyleSheet.absoluteFill}>
          <View
            style={[
              {
                width,
                top: top + 20,
              },
              styles.viewButton,
            ]}
          >
            <IconButton
              icon="close"
              variant="icon"
              style={{ position: 'absolute', left: 20 }}
              iconStyle={{ tintColor: 'white' }}
              size={30}
              onPress={close}
            />
            <Text variant="large" style={styles.whiteText}>
              <FormattedMessage
                defaultMessage="Scan your paper business card"
                description="ContactCardDetector - title Scan your paper business card"
              />
            </Text>
          </View>
          <View
            style={[
              styles.containerCameraAlign,
              {
                width,
                top:
                  boxDimension.y +
                  boxDimension.height +
                  (isHorizontal ? 50 : 15),
              },
            ]}
          >
            <Pressable
              onPress={setHorizontal}
              style={[styles.button, isHorizontal && styles.selected]}
            >
              <Image source={horizontal} style={styles.icon} />
            </Pressable>
            <Pressable
              onPress={setVertical}
              style={[styles.button, !isHorizontal && styles.selected]}
            >
              <View style={[styles.button, !isHorizontal && styles.selected]}>
                <Image source={vertical} style={styles.icon} />
              </View>
            </Pressable>
          </View>
          <View
            style={[
              {
                bottom: bottom + 20,
              },
              styles.bottomButtonController,
            ]}
          >
            <View style={styles.buttonViewContainer}>
              <IconButton
                icon="add_media"
                size={44}
                iconSize={24}
                style={styles.iconButton}
                iconStyle={{ tintColor: colors.white }}
                onPress={openPicker}
              />
            </View>

            {isCameraMode ? (
              <Pressable
                onPress={takePicture}
                style={styles.takePictureButton}
              />
            ) : (
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Ok',
                  description: 'Contact card Detector - Ok Button',
                })}
                appearance="dark"
                style={{ height: 47, width: 80 }}
                onPress={extractDataFromGalleryMedia}
              />
            )}
            <View style={styles.buttonViewContainer}>
              {!isCameraMode && (
                <IconButton
                  icon="camera"
                  size={44}
                  iconSize={24}
                  iconStyle={{ tintColor: colors.white }}
                  style={styles.iconButton}
                  onPress={() => {
                    setImageGallery(null);
                    setCameraMode();
                  }}
                />
              )}
            </View>
          </View>
        </View>
        <ScreenModal
          visible={loading}
          onRequestDismiss={closeLoading}
          gestureEnabled={false}
        >
          <UploadProgressModal
            text={intl.formatMessage({
              defaultMessage: 'Reading Information',
              description:
                'Contact card Detector - Reading Information while processing image',
            })}
          />
        </ScreenModal>
        <ScreenModal
          visible={showPicker}
          animationType="slide"
          onRequestDismiss={closePicker}
        >
          <ImagePicker
            kind="image"
            onFinished={onSelectImage}
            onCancel={closePicker}
            steps={[SelectImageStep]}
          />
        </ScreenModal>
        <PermissionModal
          permissionsFor="photo"
          onRequestClose={closePermission}
          autoFocus={showPermission}
        />
      </View>
    </GestureDetector>
  );
};

const SCAN_AREA_RATIO = 0.7;
const TAKE_BUTTON_SIZE = 74;
const BORDER_RADIUS = 20;

const styles = StyleSheet.create({
  containerImage: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'absolute',
  },
  containerCameraAlign: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  iconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 0,
  },
  buttonViewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtonController: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  viewButton: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: { color: 'white' },
  container: { backgroundColor: 'black' },
  icon: { width: 30, height: 30 },
  button: {
    width: 44,
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  takePictureButton: {
    boxSizing: 'content-box',
    width: TAKE_BUTTON_SIZE - 10,
    height: TAKE_BUTTON_SIZE - 10,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 5,
    borderColor: 'black',
  },
});

export default ContactCardDetector;
