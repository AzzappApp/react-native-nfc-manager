import { Suspense, memo, useCallback, useRef } from 'react';
import { View, StyleSheet, Animated as RNAnimated } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type DerivedValue,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import WebCardBackgroundPreview from '#components/WebCardBackgroundPreview';
import { FullScreenOverlay } from '#components/WebCardPreviewFullScreenOverlay';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import useCoverPlayPermission from '#screens/HomeScreen/useCoverPlayPermission';
import WebCardEditScreen from '#screens/WebCardEditScreen/WebCardEditScreen';
import ActivityIndicator from '#ui/ActivityIndicator';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import ChildPositionAwareScrollView from '#ui/ChildPositionAwareScrollView';
import FloatingIconButton from '#ui/FloatingIconButton';
import WebCardBlockContainer from './WebCardBlockContainer';
import { type ModuleTransitionInfo } from './WebCardEditTransition';
import WebCardScreenBody from './WebCardScreenBody';
import type { WebCardScreenContent_webCard$key } from '#relayArtifacts/WebCardScreenContent_webCard.graphql';
import type { ChildPositionAwareScrollViewHandle } from '#ui/ChildPositionAwareScrollView';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

type WebCardScreenContentProps = {
  /**
   * The webCard to display.
   */
  webCard: WebCardScreenContent_webCard$key;
  /**
   * If the native screen is ready to be displayed.
   */
  ready: boolean;
  /**
   * A ref for the scroll view.
   */
  scrollViewRef: React.RefObject<ChildPositionAwareScrollViewHandle | null>;
  /**
   * A ref for the WebCardEditScreen scroll view.
   */
  editScrollViewRef: React.RefObject<ChildPositionAwareScrollViewHandle | null>;
  /**
   * Wether the WebCardScreen is displayed from the creation screen.
   */
  fromCreation: boolean;
  /**
   * Wether the user can edit the webcard or not.
   */
  canEdit: boolean;
  /**
   * Wether the edit screen is displayed or not
   */
  editing: boolean;
  /**
   * Represent the transition between the edit and the webcard screen
   */
  editTransition: DerivedValue<number>;
  transitionInfos: Record<string, ModuleTransitionInfo> | null;
  /**
   * A callback called when the user scroll the content.
   * (only called when the user is at the top or is not at the top anymore)
   * @param atTop true if the user is at the top of the content. false otherwise.
   */
  onContentPositionChange?: (atTop: boolean) => void;
  /**
   * A callback called when the user is done editing the webcard.
   */
  onEditDone: () => void;
};

/**
 * This component render the content of the Web card.
 */
const WebCardScreenContent = ({
  webCard: webCardKey,
  ready,
  editScrollViewRef,
  scrollViewRef,
  canEdit,
  fromCreation,
  editTransition,
  editing,
  transitionInfos,
  onContentPositionChange,
  onEditDone,
}: WebCardScreenContentProps) => {
  // #region Data

  // ================================================
  //
  // ( -_•)︻デ═一
  // BE VERY CAREFUL WHEN MODIFYING THIS FRAGMENT
  // IT MIGHT BREAK THE WEBCARD APPEAR ANIMATION
  // IF YOU ADD DATA THAT ARE NOT IN CACHE WHEN COMING
  // FROM A WEBCARD LINK
  //
  // ================================================
  const webCard = useFragment(
    graphql`
      fragment WebCardScreenContent_webCard on WebCard {
        id
        userName
        coverBackgroundColor
        cardColors {
          primary
          dark
          light
        }
        ...CoverRenderer_webCard
        ...WebCardScreenBody_webCard
        ...WebCardBackgroundPreview_webCard
        ...WebCardEditScreen_webCard
        ...WebCardPreviewFullScreenOverlay_webCard
      }
    `,
    webCardKey,
  );
  // #endregion

  // #region Navigation
  const router = useRouter();
  const onClose = useCallback(() => {
    router.back();
  }, [router]);
  // #endregion

  // #endregion
  const scrollPosition = useRef(new RNAnimated.Value(0)).current;
  const wrapScroll = useCallback(
    (
      scrollHandler?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    ) =>
      RNAnimated.event(
        [{ nativeEvent: { contentOffset: { y: scrollPosition } } }],
        { useNativeDriver: true, listener: scrollHandler },
      ),
    [scrollPosition],
  );

  const coverBackgroundColor =
    swapColor(webCard.coverBackgroundColor, webCard.cardColors) ??
    webCard.cardColors?.light ??
    colors.white;

  const { width: windowWidth, height: windowHeight } = useScreenDimensions();

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const atTop = event.nativeEvent.contentOffset.y < 5;
      if (onContentPositionChange) {
        onContentPositionChange(atTop);
      }
    },
    [onContentPositionChange],
  );

  const { canPlay, paused } = useCoverPlayPermission();

  const inset = useScreenInsets();

  const editScreenStyle = useAnimatedStyle(() => ({
    opacity: editTransition.value > 0 ? 1 : 0,
  }));

  const closeButtonStyles = useAnimatedStyle(() => ({
    opacity: 1 - editTransition.value,
  }));

  return (
    <View style={styles.flex}>
      <View style={styles.background}>
        <Suspense
          fallback={
            <View
              style={{
                flex: 1,
                backgroundColor: coverBackgroundColor,
              }}
            />
          }
        >
          <WebCardBackgroundPreview webCard={webCard} style={styles.flex} />
        </Suspense>
      </View>
      <Suspense>
        <Animated.View
          style={[styles.closeButton, { top: inset.top }, closeButtonStyles]}
          pointerEvents={editing ? 'none' : 'auto'}
        >
          <FloatingIconButton
            icon="arrow_down"
            onPress={onClose}
            iconSize={30}
            variant="grey"
            iconStyle={{ tintColor: colors.white }}
            disabled={editing}
          />
        </Animated.View>
      </Suspense>
      <FullScreenOverlay
        webCard={webCard}
        width={windowWidth}
        height={windowHeight}
      >
        <ChildPositionAwareScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: BOTTOM_MENU_HEIGHT,
          }}
          contentInsetAdjustmentBehavior="never"
          scrollToOverflowEnabled
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          renderScrollView={({ onScroll, ...props }) => (
            <RNAnimated.ScrollView onScroll={wrapScroll(onScroll)} {...props} />
          )}
        >
          <WebCardBlockContainer id="cover">
            <CoverRenderer
              webCard={webCard}
              width={windowWidth}
              canPlay={ready && canPlay && !editing}
              paused={paused}
              large
              useAnimationSnapshot
            />
          </WebCardBlockContainer>
          <Suspense
            fallback={
              <View
                style={{
                  height: 60,
                  maxHeight: windowHeight - windowWidth / COVER_RATIO,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator />
              </View>
            }
          >
            <WebCardScreenBody
              webCard={webCard}
              scrollPosition={scrollPosition}
              editing={editing}
            />
          </Suspense>
        </ChildPositionAwareScrollView>
      </FullScreenOverlay>
      {canEdit && (
        <Suspense>
          <Animated.View
            style={[StyleSheet.absoluteFill, editScreenStyle]}
            pointerEvents={editing ? 'auto' : 'none'}
          >
            <WebCardEditScreen
              webCard={webCard}
              editTransition={editTransition}
              fromCreation={fromCreation}
              scrollViewRef={editScrollViewRef}
              transitionInfos={transitionInfos}
              editing={editing}
              onDone={onEditDone}
            />
          </Animated.View>
        </Suspense>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    start: 15,
    zIndex: 1,
  },
});

export default memo(WebCardScreenContent);
