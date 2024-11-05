import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useMemo } from 'react';
import ExternalToast, {
  BaseToast,
  ErrorToast,
} from 'react-native-toast-message';
import { textStyles, shadow, colors } from '#theme';
import { useStyleSheet, createStyleSheet } from '#helpers/createStyles';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import type {
  ToastProps as ExternalToastProps,
  ToastConfigParams,
} from 'react-native-toast-message';

type ToastProps = {
  /**
   * Show a close button on the right part of the toast
   *
   * @type {boolean}
   */
  showClose?: boolean;
  /**
   * a retry function, will override the showClose button if true and replace by a retry button
   *
   */
  retry?: () => void;
};

/**
 * Toast component. here is an example of how to use it wioth extra data defined for azzap case
 *  by using the props key
 * Toast.show({
      type: 'success',
      text1: 'Success message lorem ipsum',
      props: { showClose: true },
    });
 *
 * @param {(ExternalToastProps)} {
 * @return {*} 
 */
const Toast = ({
  position = 'bottom',
  autoHide = true,
  visibilityTime = 3000,
  bottomOffset = 120,
  ...props
}: ExternalToastProps) => {
  const styles = useStyleSheet(styleSheet);

  const renderTrailingIcon = useCallback(
    ({ retry, showClose }: ToastProps) => {
      if (retry) {
        return (
          <IconButton
            variant="icon"
            icon="refresh"
            size={24}
            style={styles.leftToastIconContainer}
            iconStyle={styles.closeToastIcon}
            onPress={retry}
          />
        );
      } else if (showClose) {
        return (
          <IconButton
            variant="icon"
            icon="close"
            size={24}
            style={styles.leftToastIconContainer}
            iconStyle={styles.closeToastIcon}
            onPress={ExternalToast.hide}
          />
        );
      }
      return undefined;
    },
    [styles.closeToastIcon, styles.leftToastIconContainer],
  );

  const toastConfig = useMemo(() => {
    return {
      success: (successProps: ToastConfigParams<ToastProps>) => (
        <BaseToast
          {...successProps}
          style={styles.baseToast}
          contentContainerStyle={styles.contentContainerToast}
          renderLeadingIcon={() => (
            <Icon icon="check_round" style={styles.successToastIcon} />
          )}
          renderTrailingIcon={() => renderTrailingIcon(successProps.props)}
          text1Style={[textStyles.smallbold, styles.toastText]}
          text1Props={{
            adjustsFontSizeToFit: true,
          }}
        />
      ),
      error: (errorProps: ToastConfigParams<ToastProps>) => (
        <ErrorToast
          {...errorProps}
          style={styles.baseToast}
          contentContainerStyle={styles.contentContainerToast}
          renderLeadingIcon={() => (
            <Icon icon="warning" style={styles.errorToastIcon} />
          )}
          renderTrailingIcon={() => renderTrailingIcon(errorProps.props)}
          text1Style={[textStyles.smallbold, styles.toastText]}
          text1Props={{
            adjustsFontSizeToFit: true,
            numberOfLines: 2,
          }}
        />
      ),
      info: (infoProps: ToastConfigParams<ToastProps>) => (
        <>
          <LinearGradient
            colors={
              infoProps.position === 'bottom'
                ? ['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.5)']
                : ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.4)', 'transparent']
            }
            style={[
              styles.info,
              { bottom: -bottomOffset - BOTTOM_MENU_HEIGHT - 100 },
            ]}
            pointerEvents="none"
          />
          <BaseToast
            {...infoProps}
            style={styles.baseToast}
            contentContainerStyle={styles.contentContainerToast}
            renderLeadingIcon={() => (
              <Icon icon="tips" style={styles.successToastIcon} />
            )}
            renderTrailingIcon={() => renderTrailingIcon(infoProps.props)}
            text1Style={[textStyles.smallbold, styles.toastText]}
            onPress={ExternalToast.hide}
            text1Props={{
              adjustsFontSizeToFit: true,
              numberOfLines: 2,
            }}
          />
        </>
      ),
    };
  }, [
    bottomOffset,
    renderTrailingIcon,
    styles.baseToast,
    styles.contentContainerToast,
    styles.errorToastIcon,
    styles.info,
    styles.successToastIcon,
    styles.toastText,
  ]);
  return (
    <ExternalToast
      config={toastConfig}
      position={position}
      bottomOffset={bottomOffset}
      autoHide={autoHide}
      visibilityTime={visibilityTime}
      {...props}
    />
  );
};

export default memo(Toast);

const styleSheet = createStyleSheet(appearance => ({
  baseToast: {
    height: undefined,
    borderRadius: 15,
    borderLeftWidth: 0,
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    marginHorizontal: 20,
    paddingVertical: 10,
    flex: 0,
    width: undefined,
    // TODO UI
    backgroundColor: colors.white, // appearance === 'light' ? colors.white : colors.black,
    ...shadow(appearance, 'center'),
  },
  successToastIcon: {
    // TODO UI
    tintColor: colors.black, // appearance === 'light' ? colors.black : colors.white,
    width: 18,
    height: 18,
    borderWidth: 0,
  },
  errorToastIcon: {
    tintColor: colors.red400,
    width: 18,
    height: 18,
    borderWidth: 0,
  },
  leftToastIconContainer: {
    // TODO UI
    backgroundColor: colors.black, // appearance === 'light' ? colors.black : colors.white,
  },
  closeToastIcon: {
    // TODO UI
    tintColor: colors.white, // appearance === 'dark' ? colors.black : colors.white,
  },
  contentContainerToast: {
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    flex: 0,
  },
  toastText: {
    // TODO UI
    color: colors.black, //appearance === 'light' ? colors.black : colors.white,
    width: undefined,
  },
  info: {
    height: 300,
    paddingTop: 90,
    width: '100%',
    position: 'absolute',
  },
}));
