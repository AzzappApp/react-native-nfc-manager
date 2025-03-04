import { useState, useEffect, useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';
import {
  StyleSheet,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  LinearTransition,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { COVER_CARD_RADIUS } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import { useDidAppear } from '#components/NativeRouter';
import { useTooltipContext } from '#helpers/TooltipContext';
import { useScrollViewChildRef } from '#ui/ChildPositionAwareScrollView';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import {
  BUTTON_SIZE,
  EDIT_BLOCK_GAP,
  TRANSITIONS_DURATION,
  useWebCardEditScale,
} from './webCardEditScreenHelpers';
import type { DerivedValue } from 'react-native-reanimated';

export type WebCardEditBlockContainerProps = {
  id: string;
  /**
   * A transition value for the selection mode
   */
  selectionModeTransition: DerivedValue<number>;
  /**
   * The children of the container
   */
  children: React.ReactNode;
  /**
   * If false, the edition buttons are not displayed
   *
   * @default true
   */
  displayEditionButtons?: boolean;
  /**
   * prevent the user from deleting the module if false
   * @default true
   */
  canDelete?: boolean;
  /**
   * prevent the user from moving the module if false
   * @default true
   */
  canMove?: boolean;
  /**
   * prevent the user from toggling the visibility of the module if false
   * @default true
   */
  canToggleVisibility?: boolean;
  /**
   * prevent the user from duplicating the module if false
   * @default true
   */
  canDuplicate?: boolean;
  /**
   * Whether the block is visible in the webcard
   * @default true
   */
  visible?: boolean;
  /**
   * Whether the block is selected in the webcard
   * @default true
   */
  selected?: boolean;
  /**
   * Whether the block is the first one (used to hide the move up button)
   */
  isFirst?: boolean;
  /**
   * Whether the block is the last one (used to hide the move down button)
   */
  isLast?: boolean;
  /**
   * If true, the swipeable actions are displayed
   */
  selectionMode?: boolean;
  /**
   * The background color of the card
   */
  backgroundColor: string;
  /**
   * Called when the user press a module, only enabled in edit mode
   */
  onModulePress: () => void;
  /**
   * Called when the user press the move up button
   */
  onMoveUp?: () => void;
  /**
   * Called when the user press the move down button
   */
  onMoveDown?: () => void;
  /**
   * Called when the user press the remove button
   */
  onRemove?: () => void;
  /**
   * Called when the user press the duplicate button
   */
  onDuplicate?: () => void;
  /**
   * Called when the user press the toggle visibility button
   */
  onToggleVisibility?: (visible: boolean) => void;
  /**
   * Called when the user select the block
   */
  onSelect?: (selected: boolean) => void;
};

/**
 * A simple wrapper for the webcard cover and modules that handles the edit transition
 * it also handles the interaction with the modules in edit mode
 */
const WebCardEditBlockContainer = ({
  id,
  selectionModeTransition,
  visible = true,
  displayEditionButtons = true,
  canDelete = true,
  canMove = true,
  canToggleVisibility = true,
  canDuplicate = true,
  isLast,
  isFirst,
  selectionMode,
  selected,
  backgroundColor,
  children,
  onModulePress,
  onMoveUp,
  onMoveDown,
  onRemove,
  onDuplicate,
  onToggleVisibility,
  onSelect,
}: WebCardEditBlockContainerProps) => {
  const intl = useIntl();

  const { width: windowWidth } = useWindowDimensions();

  const editScale = useWebCardEditScale();

  const buttonSize = BUTTON_SIZE / editScale;
  const iconSize = 24 / editScale;

  const enableLayoutTransition = useDidAppear();

  const dragX = useSharedValue(0);
  const dragRightLimit = (windowWidth * (1 - editScale)) / 2;
  const dragLeftLimit = (windowWidth * (editScale - 1)) / 2;

  useEffect(() => {
    if (selectionMode) {
      dragX.value = withTiming(dragRightLimit, {
        duration: TRANSITIONS_DURATION,
      });
    } else {
      dragX.value = withTiming(0, {
        duration: TRANSITIONS_DURATION,
      });
    }
  }, [dragRightLimit, dragX, selectionMode]);

  const [activeSection, setActiveSection] = useState<'left' | 'none' | 'right'>(
    'none',
  );

  useAnimatedReaction(
    () => dragX.value,
    value => {
      if (value === 0) {
        runOnJS(setActiveSection)('none');
      } else if (value === dragRightLimit) {
        runOnJS(setActiveSection)('left');
      } else if (value === dragLeftLimit) {
        runOnJS(setActiveSection)('right');
      }
    },
  );

  const panGestureActive = useSharedValue(false);
  const dragXStartValue = useSharedValue(0);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onStart(() => {
          dragXStartValue.value = dragX.value;
          panGestureActive.value = true;
        })
        .enabled(displayEditionButtons && !selectionMode)
        .onChange(e => {
          dragX.value = Math.min(
            dragRightLimit,
            Math.max(dragXStartValue.value + e.translationX, dragLeftLimit),
          );
        })
        .onEnd(() => {
          if (dragX.value > dragRightLimit / 2) {
            dragX.value = withTiming(dragRightLimit, {
              duration: 120,
            });
          } else if (dragX.value < dragLeftLimit / 2) {
            dragX.value = withTiming(dragLeftLimit, {
              duration: 120,
            });
          } else {
            dragX.value = withTiming(0, {
              duration: 120,
            });
          }
        })
        .onFinalize(() => {
          panGestureActive.value = false;
        }),
    [
      displayEditionButtons,
      dragLeftLimit,
      dragRightLimit,
      dragX,
      dragXStartValue,
      panGestureActive,
      selectionMode,
    ],
  );

  const touchActive = useSharedValue(0);
  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .enabled(activeSection === 'none')
        .onBegin(() => {
          touchActive.value = withTiming(1);
        })
        .onStart(() => {
          runOnJS(onModulePress)();
        })
        .onFinalize(() => {
          touchActive.value = withTiming(0);
        }),
    [activeSection, onModulePress, touchActive],
  );

  const appearance = useColorScheme() ?? 'light';
  const moduleContainerStyle = useAnimatedStyle(() => ({
    borderRadius: COVER_CARD_RADIUS * windowWidth,
    overflow: 'visible',
    backgroundColor,
    transform: [{ translateX: dragX.value }],
    width: windowWidth,
  }));

  const moduleInnerContainerStyle = useAnimatedStyle(() => ({
    borderRadius: COVER_CARD_RADIUS * windowWidth - 2,
    overflow: 'hidden',
    opacity: interpolate(touchActive.value, [0, 1], [1, 0.2]),
  }));

  const actionSectionBaseStyle = {
    position: 'absolute',
    alignItems: 'center',
    flexDirection: 'row',
    height: '100%',
    gap: 20,
  } as const;

  const firstMoveButtonStyle = useAnimatedStyle(() => ({
    opacity: isFirst
      ? withTiming(0, { duration: 300 })
      : dragX.value === 0
        ? withTiming(1, { duration: 300 })
        : Math.max(0, 1 - Math.abs(dragX.value) / dragRightLimit),
  }));

  const lastMoveButtonStyle = useAnimatedStyle(() => ({
    opacity: isLast
      ? withTiming(0, { duration: 300 })
      : dragX.value === 0
        ? withTiming(1, { duration: 300 })
        : Math.max(0, 1 - Math.abs(dragX.value) / dragRightLimit),
  }));

  const leftSectionStyle = useAnimatedStyle(() => ({
    opacity: Math.max(
      0,
      dragX.value / dragRightLimit - (selectionModeTransition?.value ?? 0),
    ),
  }));

  const selectionSectionStyle = useAnimatedStyle(() => ({
    opacity: selectionModeTransition?.value ?? 0,
  }));

  const rightSectionStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, dragX.value / dragLeftLimit),
  }));

  const { registerTooltip, unregisterTooltip } = useTooltipContext();

  const containerRef = useScrollViewChildRef(id);
  const ref = useRef(null);

  useEffect(() => {
    if (id === 'cover') {
      registerTooltip('cover', {
        ref,
      });
    } else {
      registerTooltip('section', {
        ref,
      });
    }

    return () => {
      if (id === 'cover') {
        unregisterTooltip('cover');
      } else {
        unregisterTooltip('section');
      }
    };
  }, [id, registerTooltip, unregisterTooltip]);

  return (
    <Animated.View
      entering={
        enableLayoutTransition
          ? FadeIn.duration(TRANSITIONS_DURATION)
          : undefined
      }
      exiting={
        enableLayoutTransition
          ? FadeOut.duration(TRANSITIONS_DURATION)
          : undefined
      }
      layout={
        enableLayoutTransition
          ? LinearTransition.easing(Easing.inOut(Easing.ease)).duration(
              TRANSITIONS_DURATION,
            )
          : undefined
      }
    >
      <View
        style={{
          display: 'flex',
          marginVertical: EDIT_BLOCK_GAP / editScale,
          minHeight: BUTTON_SIZE,
          justifyContent: 'center',
        }}
      >
        <GestureDetector gesture={Gesture.Race(tapGesture, panGesture)}>
          <Animated.View style={[moduleContainerStyle, shadow({ appearance })]}>
            {/** this View is only here because ios bug with shadow and overflow hidden */}
            <Animated.View
              ref={ref}
              style={moduleInnerContainerStyle}
              accessibilityHint={intl.formatMessage({
                defaultMessage: `Press to edit this section of your profile`,
                description: `Accessibility hint for the profile block container`,
              })}
            >
              <View
                pointerEvents="none"
                // DO NOT REMOVE TO AVOID flash of unstyled content on Android
                collapsable={false}
                ref={containerRef}
              >
                {children}
              </View>
              {!visible && (
                <View
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    //prettier-ignore
                    backgroundColor: `${appearance === 'dark' ? colors.black : colors.white}99`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    icon="hide"
                    style={{ width: iconSize, height: iconSize * 2 }}
                  />
                </View>
              )}
            </Animated.View>
          </Animated.View>
        </GestureDetector>

        {displayEditionButtons && (
          <>
            <Animated.View
              style={[
                lastMoveButtonStyle,
                actionSectionBaseStyle,
                {
                  left: -buttonSize - 20,
                  pointerEvents: activeSection !== 'none' ? 'none' : 'auto',
                },
              ]}
            >
              <IconButton
                onPress={onMoveDown}
                disabled={activeSection !== 'none' || !canMove}
                icon="arrow_down"
                size={buttonSize}
                iconSize={iconSize}
                style={{
                  borderColor: colors.grey200,
                }}
                iconStyle={{
                  tintColor: colors.grey200,
                }}
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Move down',
                  description:
                    'Accessibility label for the move down button in the profile edition screen',
                })}
                accessibilityHint={intl.formatMessage({
                  defaultMessage: 'Moves the module down',
                  description:
                    'Accessibility hint for the move down button in the profile edition screen',
                })}
              />
            </Animated.View>

            <Animated.View
              style={[
                firstMoveButtonStyle,
                actionSectionBaseStyle,
                { right: -buttonSize - 20 },
              ]}
              pointerEvents={activeSection !== 'none' ? 'none' : 'auto'}
            >
              <IconButton
                onPress={onMoveUp}
                disabled={activeSection !== 'none' || !canMove}
                icon="arrow_up"
                size={buttonSize}
                iconSize={iconSize}
                style={{
                  borderColor: colors.grey200,
                }}
                iconStyle={{
                  tintColor: colors.grey200,
                }}
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Move up',
                  description:
                    'Accessibility label for the move up button in the profile edition screen',
                })}
                accessibilityHint={intl.formatMessage({
                  defaultMessage: 'Moves the module up',
                  description:
                    'Accessibility hint for the move up button in the profile edition screen',
                })}
              />
            </Animated.View>

            <Animated.View
              style={[
                leftSectionStyle,
                actionSectionBaseStyle,
                { left: -buttonSize - 20 },
              ]}
              pointerEvents={
                activeSection !== 'left' || selectionMode ? 'none' : 'auto'
              }
            >
              <IconButton
                onPress={() => onToggleVisibility?.(!visible)}
                disabled={
                  activeSection !== 'left' ||
                  selectionMode ||
                  !canToggleVisibility
                }
                icon={visible ? 'hide' : 'preview'}
                size={buttonSize}
                iconSize={iconSize}
                accessibilityLabel={
                  visible
                    ? intl.formatMessage({
                        defaultMessage: 'Hide',
                        description:
                          'Accessibility label for the hide button in the profile edition screen',
                      })
                    : intl.formatMessage({
                        defaultMessage: 'Show',
                        description:
                          'Accessibility label for the show button in the profile edition screen',
                      })
                }
                accessibilityHint={
                  visible
                    ? intl.formatMessage({
                        defaultMessage:
                          'This action hides a section of your WebCard.',
                        description:
                          'Accessibility hint for the hide button in the profile edition screen',
                      })
                    : intl.formatMessage({
                        defaultMessage: 'Shows the section in your WebCard',
                        description:
                          'Accessibility hint for the show button in the profile edition screen',
                      })
                }
              />
              <IconButton
                onPress={onDuplicate}
                disabled={
                  activeSection !== 'left' || selectionMode || !canDuplicate
                }
                icon="background"
                size={buttonSize}
                iconSize={iconSize}
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Duplicate',
                  description:
                    'Accessibility label for the duplicate button in the profile edition screen',
                })}
                accessibilityHint={intl.formatMessage({
                  defaultMessage: 'This action duplicates a WebCard section.',
                  description:
                    'Accessibility hint for the duplicate button in the profile edition screen',
                })}
              />
            </Animated.View>

            <Animated.View
              style={[
                selectionSectionStyle,
                actionSectionBaseStyle,
                { left: (-buttonSize - 20) / 2 },
              ]}
              pointerEvents={
                activeSection !== 'left' || !selectionMode ? 'none' : 'auto'
              }
            >
              <IconButton
                onPress={() => onSelect?.(!selected)}
                disabled={activeSection !== 'left' || !selectionMode}
                icon="check"
                size={buttonSize}
                iconSize={iconSize}
                iconStyle={{ tintColor: 'white', opacity: selected ? 1 : 0 }}
                style={{
                  backgroundColor: selected ? colors.black : 'white',
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={
                  selected
                    ? intl.formatMessage({
                        defaultMessage: 'Unselect',
                        description:
                          'Accessibility label for the select button in the profile edition screen',
                      })
                    : intl.formatMessage({
                        defaultMessage: 'Select',
                        description:
                          'Accessibility label for the select button in the profile edition screen',
                      })
                }
              />
            </Animated.View>

            <Animated.View
              style={[
                rightSectionStyle,
                actionSectionBaseStyle,
                { right: (-buttonSize - 20) / 2 },
              ]}
              pointerEvents={activeSection !== 'right' ? 'none' : 'auto'}
            >
              <IconButton
                onPress={onRemove}
                disabled={activeSection !== 'right' || !canDelete}
                icon="delete"
                size={buttonSize}
                iconSize={iconSize}
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Delete',
                  description:
                    'Accessibility label for the delete button in the profile edition screen',
                })}
                accessibilityHint={intl.formatMessage({
                  defaultMessage:
                    'This action deletes the section from your WebCard',
                  description:
                    'Accessibility hint for the delete button in the profile edition screen',
                })}
              />
            </Animated.View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

export default WebCardEditBlockContainer;
