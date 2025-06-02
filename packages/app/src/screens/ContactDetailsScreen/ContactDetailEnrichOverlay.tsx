import { Canvas, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Platform,
  Pressable,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { PopoverMode } from 'react-native-popover-view';
import { Placement } from 'react-native-popover-view/dist/Types';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useFragment } from 'react-relay';
import { graphql } from 'relay-runtime';
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
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import Tooltip from '#ui/Tooltip';
import type { ContactDetailEnrichOverlay_user$key } from '#relayArtifacts/ContactDetailEnrichOverlay_user.graphql';
import type { ContactDetailEnrichState } from './ContactDetailsBody';
import type { Component, RefObject } from 'react';

const ENRICH_TOOLTIP = 'enrichTooltip';

export const ContactDetailEnrichOverlay = ({
  onEnrich,
  onStopEnrich,
  state,
  onValidateEnrichment,
  onRefuseEnrichment,
  currentUserKey,
  setOverlayState,
}: {
  onEnrich: () => void;
  onStopEnrich: () => void;
  state: ContactDetailEnrichState;
  onValidateEnrichment: () => void;
  onRefuseEnrichment: () => void;
  setOverlayState: (state: ContactDetailEnrichState) => void;
  currentUserKey: ContactDetailEnrichOverlay_user$key | null;
}) => {
  const styles = useStyleSheet(styleSheet);

  const data = useFragment(
    graphql`
      fragment ContactDetailEnrichOverlay_user on User {
        nbEnrichments {
          max
          total
        }
      }
    `,
    currentUserKey,
  );

  const enrichButtonRef = useRef<View>(null);
  const intl = useIntl();
  const { bottom } = useScreenInsets();

  const { tooltips } = useTooltipDataContext();
  const colorScheme = useColorScheme();

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
    } else if (
      state === 'waitingApproval' ||
      state === 'idle' ||
      state === 'maxEnrichmentReached'
    ) {
      closeTooltips([ENRICH_TOOLTIP]);
    }
  }, [toggleTooltips, state, openTooltips, closeTooltips]);

  const router = useRouter();

  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.container}>
      {state === 'loading' || state === 'maxEnrichmentReached' ? (
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
          {state === 'loading' ? (
            <>
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
              <PressableOpacity
                style={styles.stopEnrichContainer}
                onPress={onStopEnrich}
              >
                <Text variant="small" style={styles.stopEnrichText}>
                  {intl.formatMessage({
                    defaultMessage: 'Stop enrichment',
                    description:
                      'ContactDetail enrich overlay - Stop enrichment',
                  })}
                </Text>
              </PressableOpacity>

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
            </>
          ) : (
            <View
              style={[
                {
                  paddingBottom: bottom + 120,
                },
                styles.enrichErrorContainer,
              ]}
            >
              <Text variant="xlarge" style={styles.enrichErrorText}>
                <FormattedMessage
                  defaultMessage="You've Reached the Limit!"
                  description="ContactDetail enrich overlay - Max enrichment reached title message"
                />
              </Text>
              <Text variant="medium" style={styles.enrichErrorText}>
                <FormattedMessage
                  defaultMessage="We're thrilled you enjoyed enriching your contacts with AI! You've reached the maximum number of free enrichments."
                  description="ContactDetail enrich overlay - Max enrichment reached detail message"
                />
              </Text>
              <Text variant="medium" style={styles.enrichErrorText}>
                <FormattedMessage
                  defaultMessage="This feature will be available soon as part of a premium offering — stay tuned!"
                  description="ContactDetail enrich overlay - Max enrichment reached detail message"
                />
              </Text>
            </View>
          )}
          <View
            style={[
              styles.enrichmentCounterContainer,
              {
                bottom: bottom + 40,
              },
            ]}
          >
            <View style={styles.enrichmentCounterContainerHeader}>
              <Text
                variant="xlarge"
                style={[
                  styles.aiEnrichText,
                  styles.enrichmentCounterBigNumber,
                  {
                    color:
                      state === 'maxEnrichmentReached'
                        ? colors.red400
                        : colors.tropicalAquaTone,
                  },
                ]}
              >
                {data?.nbEnrichments?.total ?? 0}{' '}
              </Text>

              <Text variant="medium" style={styles.aiEnrichText}>
                / {data?.nbEnrichments?.max ?? 0}
              </Text>
            </View>
            <Text variant="medium" style={styles.aiEnrichText}>
              <FormattedMessage
                defaultMessage="free enrichments"
                description="ContactDetail enrich overlay - enrichment counter subtitle"
              />
            </Text>

            <IconButton
              icon="close"
              size={44}
              iconSize={24}
              iconStyle={styles.closeIcon}
              style={styles.closeIconContainer}
              onPress={
                state === 'loading'
                  ? router.back
                  : () => setOverlayState('idle')
              }
            />
          </View>
        </View>
      ) : state === 'waitingApproval' ? (
        <Animated.View
          style={styles.confirmationContainer}
          exiting={FadeOut}
          entering={Platform.OS === 'ios' ? FadeIn : undefined}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.7))']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              height: 267 + bottom,
              position: 'absolute',
              width: '100%',
              pointerEvents: 'none',
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
          entering={Platform.OS === 'ios' ? FadeIn : undefined}
        >
          <Tooltip
            mode={PopoverMode.RN_MODAL}
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
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Got it',
                  description:
                    'ContactDetail enrich overlay Tooltip - Got it button label',
                })}
                style={styles.tooltipButton}
                textStyle={styles.tooltipButtonText}
                variant="secondary"
                onPress={onCloseToolTipEnrich}
              />
            </Pressable>
          </Tooltip>
          <PressableOpacity
            onPress={onEnrich}
            style={[styles.enrichButtonContainer, { bottom: bottom + 20 }]}
          >
            <View style={styles.iconContainerStyle} ref={enrichButtonRef}>
              <Icon
                icon={colorScheme === 'light' ? 'enrich_light' : 'enrich_dark'}
                size={ENRICH_ICON_SIZE}
                style={styles.iconStyle}
              />
            </View>
          </PressableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const ENRICH_ICON_SIZE = 72;

const styleSheet = createStyleSheet(appearance => ({
  container: {
    width: '100%',
    height: '100%',
    zIndex: 1,
    flex: 1,
    position: 'absolute',
    pointerEvents: 'box-none',
  },
  flex: { flex: 1 },
  enrichContainer: { flex: 1, pointerEvents: 'box-none' },
  enrichButtonContainer: {
    position: 'absolute',
    paddingBottom: 50,
    width: '100%',
    height: ENRICH_ICON_SIZE,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  closeTooltip: {
    padding: 15,
    gap: 9,
    alignSelf: 'center',
  },
  iconStyle: {
    tintColor: undefined,
    borderRadius: 50,
  },
  iconContainerStyle: {
    borderRadius: 50,
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
  fullscreen: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  closeIconContainer: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 0,
    backgroundColor: colors.black,
    borderColor: colors.white,
  },
  closeIcon: { tintColor: colors.white },
  tooltipText: {
    alignSelf: 'center',
    textAlign: 'center',
    color: colors.grey400,
  },
  tooltipButton: { alignSelf: 'center' },
  tooltipButtonText: { color: colors.black },
  aiEnrichText: { color: colors.white, textAlign: 'center' },
  enrichmentCounterContainer: {
    position: 'absolute',
    height: '20%',
    width: '100%',
  },
  enrichmentCounterContainerHeader: {
    flexDirection: 'row',
    alignSelf: 'center',
  },
  enrichmentCounterBigNumber: { bottom: 4 },
  stopEnrichContainer: {
    position: 'absolute',
    flex: 1,
    top: 100,
    width: '100%',
    paddingHorizontal: 20,
  },
  stopEnrichText: {
    color: colors.white,
    textAlign: 'right',
    textDecorationLine: 'underline',
    opacity: 0.3,
  },
  enrichErrorContainer: {
    position: 'absolute',
    width: '90%',
    height: '100%',
    padding: 20,
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 20,
  },
  enrichErrorText: { textAlign: 'center', color: colors.white },
}));
