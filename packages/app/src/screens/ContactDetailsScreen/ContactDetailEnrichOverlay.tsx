import { Canvas, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { Placement } from 'react-native-popover-view/dist/Types';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, shadow } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  useTooltipContext,
  useTooltipDataContext,
} from '#helpers/TooltipContext';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import Text from '#ui/Text';
import Tooltip from '#ui/Tooltip';
import type { ContactDetailEnrichState } from './ContactDetailsBody';
import type { Component, RefObject } from 'react';

const ENRICH_TOOLTIP = 'enrichTooltip';

export const ContactDetailEnrichOverlay = ({
  onEnrich,
  state,
  onValidateEnrichment,
  onRefuseEnrichment,
}: {
  onEnrich: () => void;
  state: ContactDetailEnrichState;
  onValidateEnrichment: () => void;
  onRefuseEnrichment: () => void;
}) => {
  const styles = useStyleSheet(styleSheet);

  const enrichButtonRef = useRef<View>(null);
  const intl = useIntl();
  const { bottom } = useScreenInsets();

  const { tooltips } = useTooltipDataContext();

  const {
    openTooltips,
    closeTooltips,
    toggleTooltips,
    registerTooltip,
    unregisterTooltip,
  } = useTooltipContext();

  useEffect(() => {
    if (!enrichButtonRef.current) {
      return;
    }
    registerTooltip(ENRICH_TOOLTIP, {
      ref: enrichButtonRef,
    });
    return () => {
      unregisterTooltip(ENRICH_TOOLTIP);
    };
  }, [registerTooltip, unregisterTooltip]);

  const onCloseToolTipEnrich = useCallback(() => {
    closeTooltips([ENRICH_TOOLTIP]);
  }, [closeTooltips]);

  useEffect(() => {
    if (state === 'tooltipVisible') {
      openTooltips([ENRICH_TOOLTIP]);
    } else if (state === 'waitingApproval') {
      closeTooltips([ENRICH_TOOLTIP]);
    } else if (state === 'idle') {
      closeTooltips([ENRICH_TOOLTIP]);
    }
  }, [toggleTooltips, state, openTooltips, closeTooltips]);

  const router = useRouter();

  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.container}>
      {state === 'loading' ? (
        <View style={styles.fullscreen}>
          <Canvas style={styles.fullscreen}>
            <Rect x={0} y={0} width={width} height={height}>
              <RadialGradient
                c={vec(width / 2, height - bottom - 20)}
                r={height}
                colors={['#000000F2', '#000000CC']}
              />
            </Rect>
          </Canvas>
          <LottieView
            source={require('#assets/azzapp_AI_loading.json')}
            autoPlay
            loop
            hardwareAccelerationAndroid
            style={{
              left: -width / 2,
              width: width * 2,
              height: width * 2,
            }}
          />
          <View
            style={{
              alignSelf: 'center',
              top: -width + 50,
            }}
          >
            <Text variant="large" style={styles.aiEnrichText}>
              <FormattedMessage
                defaultMessage="AI enrichment"
                description="ContactDetail enrich overlay - AI enrichment subtitle"
              />
            </Text>
          </View>
          <IconButton
            icon="close"
            size={44}
            iconSize={24}
            iconStyle={styles.closeIcon}
            style={{
              position: 'absolute',
              alignSelf: 'center',
              bottom: 20 + bottom,
              backgroundColor: colors.black,
              borderColor: colors.white,
            }}
            onPress={router.back}
          />
        </View>
      ) : state === 'waitingApproval' ? (
        <Animated.View
          style={styles.confirmationContainer}
          exiting={FadeOut}
          entering={FadeIn}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.7))']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              height: 267 + bottom,
              position: 'absolute',
              width: '100%',
              pointerEvents: 'box-none',
            }}
          />
          <View
            style={[
              styles.confirmationBackgroundContainer,
              { height: 190 + bottom },
            ]}
          >
            <Icon
              icon="filters_ai_light"
              size={40}
              style={styles.confirmationIconStyle}
            />
            <Text variant="medium" style={styles.confirmationTitle}>
              <FormattedMessage
                defaultMessage="Validate the contact enrichment"
                description="ContactDetail enrich overlay - confirmation message title"
              />
            </Text>

            <Text variant="xsmall" style={styles.confirmationSubtitle}>
              <FormattedMessage
                defaultMessage="Please check the enriched fields and validate it"
                description="ContactDetail enrich overlay - confirmation message subtitle"
              />
            </Text>
            <View style={styles.confirmationButtonsContainer}>
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Refuse',
                  description:
                    'ContactDetail enrich overlay - Refuse button label',
                })}
                variant="secondary"
                onPress={onRefuseEnrichment}
              />
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Validate',
                  description:
                    'ContactDetail enrich overlay - Validate button label',
                })}
                onPress={onValidateEnrichment}
              />
            </View>
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          style={styles.enrichContainer}
          exiting={FadeOut}
          entering={FadeIn}
        >
          <Tooltip
            offset={Platform.OS === 'ios' ? 0 : 25}
            tooltipWidth={269}
            from={tooltips[ENRICH_TOOLTIP]?.ref as RefObject<Component>}
            placement={Placement.TOP}
            isVisible={tooltips[ENRICH_TOOLTIP]?.visible}
            onRequestClose={onCloseToolTipEnrich}
            onPress={onCloseToolTipEnrich}
          >
            <Pressable
              style={styles.closeTooltip}
              onPress={onCloseToolTipEnrich}
            >
              <Image
                style={styles.aiIcon}
                source={require('#assets/filters_ai_light_big.png')}
              />
              <Text variant="medium" style={styles.headerStyle}>
                <FormattedMessage
                  defaultMessage="Enrich your contact"
                  description="ContactDetail enrich overlay Tooltip - Tooltip header for enrich button"
                />
              </Text>
              <Text variant="small" style={styles.tooltipText}>
                <FormattedMessage
                  defaultMessage="Use azzapp AI to enrich your contact informations and learn more about him"
                  description="ContactDetail enrich overlay Tooltip - Tooltip description azzapp AI"
                />
              </Text>
              <RoundedMenuComponent
                id={null}
                label={intl.formatMessage({
                  defaultMessage: 'Got it',
                  description:
                    'ContactDetail enrich overlay Tooltip - Got it button label',
                })}
                style={styles.tooltipButton}
                textStyle={styles.tooltipButtonText}
                textVariant="button"
                onSelect={onCloseToolTipEnrich}
              />
            </Pressable>
          </Tooltip>
          <View
            style={[styles.enrichButtonContainer, { bottom: bottom + 20 }]}
            ref={enrichButtonRef}
          >
            <View style={styles.enrichBackground}>
              <LinearGradient
                colors={['#B02EFB', '#1E6BCF', '#1962C1', '#23CFCC']}
                start={{ x: 0.15, y: 0.15 }}
                end={{ x: 0.8, y: 0.8 }}
                style={styles.gradient}
              />
              <IconButton
                icon="filters_ai_light"
                onPress={onEnrich}
                size={40}
                iconSize={24}
                iconStyle={styles.iconStyle}
                style={styles.iconContainerStyle}
              />
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  container: {
    width: '100%',
    height: '100%',
    zIndex: 1,
    flex: 1,
    position: 'absolute',
    pointerEvents: 'box-none',
  },
  enrichBackground: {
    borderWidth: 8,
    color: appearance === 'dark' ? colors.grey1000 : colors.grey50,
    borderColor: appearance === 'dark' ? colors.grey1000 : colors.grey50,
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  enrichContainer: { flex: 1, pointerEvents: 'box-none' },
  enrichButtonContainer: {
    position: 'absolute',
    paddingBottom: 50,
    width: '100%',
    height: 72,
    alignItems: 'center',
    pointerEvents: 'box-none',
    zIndex: 1,
    ...shadow({ appearance: 'light', direction: 'bottom' }),
  },
  closeTooltip: {
    padding: 15,
    gap: 9,
    alignSelf: 'center',
  },
  iconStyle: {
    tintColor: undefined,
  },
  iconContainerStyle: {
    position: 'absolute',
    borderColor: 'transparent',
    top: 8,
    left: 8,
    backgroundColor: appearance === 'dark' ? colors.grey1000 : colors.grey50,
    ...shadow({ appearance: 'light', direction: 'bottom' }),
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  confirmationBackgroundContainer: {
    width: '100%',
    backgroundColor: appearance === 'dark' ? colors.grey1000 : colors.white,
    gap: 9,
    padding: 15,
    alignSelf: 'center',
  },
  confirmationIconStyle: {
    alignSelf: 'center',
    top: 4,
    tintColor: undefined,
  },
  confirmationTitle: { textAlign: 'center' },
  confirmationSubtitle: {
    textAlign: 'center',
    color: appearance === 'dark' ? colors.grey600 : colors.grey400,
  },
  confirmationButtonsContainer: {
    flexDirection: 'row',
    height: 64,
    flex: 1,
    alignSelf: 'center',
    paddingTop: 15,
    paddingBottom: 10,
    gap: 10,
  },
  confirmationRefuseStyle: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    gap: 10,
    borderColor: appearance === 'dark' ? colors.white : colors.grey500,
  },
  confirmationValidateStyle: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    gap: 10,
    backgroundColor: appearance === 'dark' ? colors.white : colors.black,
  },
  confirmationValidateTextStyle: {
    color: appearance === 'dark' ? colors.black : colors.white,
  },
  aiIcon: { alignSelf: 'center', width: 60, height: 60 },
  headerStyle: { alignSelf: 'center', color: colors.black },
  gradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    position: 'absolute',
    top: -8,
    left: -8,
    zIndex: -1,
    borderWidth: 8,
  },
  fullscreen: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  closeIcon: { tintColor: colors.white },
  tooltipText: {
    alignSelf: 'center',
    textAlign: 'center',
    color: colors.grey400,
  },
  tooltipButton: { alignSelf: 'center' },
  tooltipButtonText: { color: colors.black },
  aiEnrichText: { color: colors.white },
}));
