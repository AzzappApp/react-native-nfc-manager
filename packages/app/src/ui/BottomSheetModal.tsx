import {
  BottomSheetBackdrop,
  BottomSheetModal as BottomSheetModalG,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Keyboard } from 'react-native';
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { colors, shadow } from '#theme';
import Toast from '#components/Toast';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import type {
  BottomSheetBackdropProps,
  BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import type { ViewStyle } from 'react-native';

export type Props = BottomSheetModalProps & {
  children?: React.ReactNode | undefined;
  visible: boolean;
  /**
   * add a small horizontal line marker to indicate the gesture is available, and activate the gesture
   * If required to have gesture without marker, //TODO: add a separate props
   *
   * @type {boolean} @default true
   */
  showHandleIndicator?: boolean;
  /**
   * lazy mode, will not load the content of bottome sheet and return null
   * if the bottom sheet is not visible
   *
   * @default false
   * @type {boolean}
   */
  lazy?: boolean;
  /**
   * Optional Height of the bottom sheet. If defined, the automatic sizing will be disabled
   * and the height will be fixed to the given value.
   *
   * @default undefined
   * @type {number}
   */
  height?: number;
  /**
   * add a bottom padding automatically based on the bottom insets and the phone's safe area
   * This props allows to remove it in a case of a Scrollable content for example
   * @default true
   * @type {boolean}
   */
  automaticBottomPadding?: boolean;
  /**
   * add a bottom padding automatically based on the top insets and the phone's safe area
   * This props allows to remove it in a case of a fullscreen or Scrollable content for example
   * @default true
   * @type {boolean}
   */
  automaticTopPadding?: boolean;
  /**
   * If true, create a backdrop that allow te be touched in order to close the bottom
   *
   * @type {boolean}
   */
  closeOnBackdropTouch?: boolean;
  /**
   *  The variant of the bottomsheet @default 'default'
   *  if modal, a darkened backdrop will appear
   */
  variant?: 'default' | 'modal';
  /**
   * will close the existing keyboard on opening if true
   *
   * @type {boolean}
   */
  dismissKeyboardOnOpening?: boolean;

  /**
   * Additionnal style for the background (append to default style)
   */
  backgroundStyle?: ViewStyle;

  /*
   * show shadow on top of modal
   */
  showShadow?: boolean;

  /**
   * this props enable the resizing of the bottom sheet on its content when scrolling
   * This used in addition with SnapPoint props that need to contain at least 2 values
   * don't delete before reading the purpose and it is used
   *
   * @type {boolean}
   */
  nestedScroll?: boolean;
};

/**
 * A simple bottom sheet component
 */
const BottomSheetModal = ({
  children,
  visible,
  showHandleIndicator = true,
  style,
  height,
  automaticBottomPadding = true,
  automaticTopPadding = true,
  enableContentPanningGesture,
  closeOnBackdropTouch = true,
  variant,
  dismissKeyboardOnOpening = false,
  backgroundStyle,
  showShadow = true,
  nestedScroll = false,
  ...props
}: Props) => {
  const styles = useStyleSheet(styleSheet);

  const bottomSheetModalRef = useRef<BottomSheetModalG>(null);

  useEffect(() => {
    if (visible) {
      if (dismissKeyboardOnOpening) {
        Keyboard.dismiss();
      }
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [dismissKeyboardOnOpening, visible]);

  const { bottom } = useScreenInsets();
  const paddingBottom = useMemo(() => {
    return bottom + 15;
  }, [bottom]);

  const dynamicProps = useMemo(() => {
    const commonProps = {
      enableHandlePanningGesture: showHandleIndicator,
      enableContentPanningGesture:
        enableContentPanningGesture != null
          ? enableContentPanningGesture
          : showHandleIndicator,
      style: showShadow ? [styles.modalContainer, style] : style,
    };
    if (height !== null && height !== undefined && height > 0) {
      return {
        index: 0,
        snapPoints: [height],
        enableDynamicSizing: false,
        ...commonProps,
      };
    } else {
      return {
        enableDynamicSizing: true,
        ...commonProps,
      };
    }
  }, [
    enableContentPanningGesture,
    height,
    showHandleIndicator,
    showShadow,
    style,
    styles.modalContainer,
  ]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => {
      if (!closeOnBackdropTouch) {
        return null;
      }
      if (variant !== 'modal') {
        return (
          <BottomSheetBackdrop
            {...props}
            style={[props.style, { backgroundColor: 'transparent' }]}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={1}
            pressBehavior="close"
          />
        );
      }
      return <CustomBackdrop closeOnBackdropTouch {...props} />;
    },
    [closeOnBackdropTouch, variant],
  );

  const backgroundStyleInner = backgroundStyle
    ? [styles.backgroundStyle, backgroundStyle]
    : styles.backgroundStyle;
  return (
    <BottomSheetModalG
      ref={bottomSheetModalRef}
      enableDismissOnClose
      handleIndicatorStyle={styles.gestureInteractionIndicator}
      handleStyle={styles.handleStyle}
      backgroundStyle={backgroundStyleInner}
      handleComponent={showHandleIndicator ? undefined : null}
      backdropComponent={renderBackdrop}
      keyboardBlurBehavior="restore"
      {...dynamicProps}
      {...props}
    >
      {nestedScroll ? (
        children
      ) : (
        <BottomSheetView
          style={[
            styles.container,
            {
              height: height ? height : undefined,
              paddingBottom: automaticBottomPadding ? paddingBottom : 0,
              paddingTop: showHandleIndicator
                ? 0
                : automaticTopPadding
                  ? 16
                  : undefined,
            },
          ]}
        >
          {children}
        </BottomSheetView>
      )}
      <Toast />
    </BottomSheetModalG>
  );
};

export default BottomSheetModal;

const styleSheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
  },
  backgroundStyle: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  gestureInteractionIndicator: {
    backgroundColor: appearance === 'light' ? colors.grey100 : colors.white,
    height: 4,
    width: 40,
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: 4,
  },
  handleStyle: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 0,
    ...shadow(appearance, 'top'),
  },
}));

const CustomBackdrop = ({
  closeOnBackdropTouch,
  animatedIndex,
  style,
  ...props
}: BottomSheetBackdropProps & { closeOnBackdropTouch: boolean }) => {
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        animatedIndex.value,
        [-1, 0],
        [0, 0.6],
        Extrapolation.CLAMP,
      ),
    };
  });

  if (!closeOnBackdropTouch) {
    return null;
  }

  return (
    <BottomSheetBackdrop
      {...props}
      style={[style, containerAnimatedStyle]}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close"
      animatedIndex={animatedIndex}
    />
  );
};
