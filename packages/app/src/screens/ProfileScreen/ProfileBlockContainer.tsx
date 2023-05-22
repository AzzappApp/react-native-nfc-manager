import { useCallback, useState, useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { COVER_CARD_RADIUS } from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import {
  BUTTON_SIZE,
  EDIT_TRANSITION_DURATION,
  useProfileEditScale,
} from './profileScreenHelpers';
import type { ProfileBlockContainerProps } from './profileScreenTypes';
import type { LayoutChangeEvent } from 'react-native';

/**
 * A simple wrapper for the webcard cover and modules that handles the edit transition
 * it also handles the interaction with the modules in edit mode
 */
const ProfileBlockContainer = ({
  editing,
  visible = true,
  displayEditionButtons = true,
  isLast,
  isFirst,
  selectionMode,
  selected,
  children,
  onModulePress,
  onMoveUp,
  onMoveDown,
  onRemove,
  onDuplicate,
  onToggleVisibility,
  onSelect,
}: ProfileBlockContainerProps) => {
  const intl = useIntl();

  const { width: windowWith } = useWindowDimensions();

  const [measuredHeight, setMeasuredHeight] = useState(0);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setMeasuredHeight(event.nativeEvent.layout.height);
  }, []);

  const editScale = useProfileEditScale();

  const buttonSize = BUTTON_SIZE / editScale;
  const iconSize = 24 / editScale;

  const height =
    editing && measuredHeight < buttonSize ? buttonSize : measuredHeight;

  const editingSharedValue = useSharedValue(editing ? 1 : 0);
  useEffect(() => {
    editingSharedValue.value = withTiming(editing ? 1 : 0, {
      duration: EDIT_TRANSITION_DURATION,
    });
  }, [editing, editingSharedValue]);

  const dragX = useSharedValue(0);
  const dragRightLimit = (windowWith * (1 - editScale)) / 2;
  const dragLeftLimit = (windowWith * (editScale - 1)) / 2;

  useEffect(() => {
    if (selectionMode && editing) {
      dragX.value = withTiming(dragRightLimit, {
        duration: EDIT_TRANSITION_DURATION,
      });
    } else {
      dragX.value = withTiming(0, {
        duration: EDIT_TRANSITION_DURATION,
      });
    }
  }, [dragRightLimit, dragX, editing, selectionMode]);

  const selectionModeSharedValue = useSharedValue(selectionMode ? 1 : 0);
  useEffect(() => {
    selectionModeSharedValue.value = withTiming(selectionMode ? 1 : 0, {
      duration: EDIT_TRANSITION_DURATION,
    });
  }, [selectionMode, selectionModeSharedValue]);

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

  const dragXStartValue = useSharedValue(0);
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onStart(() => {
          dragXStartValue.value = dragX.value;
        })
        .enabled(editing && displayEditionButtons && !selectionMode)
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
        }),
    [
      displayEditionButtons,
      dragLeftLimit,
      dragRightLimit,
      dragX,
      dragXStartValue,
      editing,
      selectionMode,
    ],
  );

  // gap doesn't work on reanimated 2
  const blockStyle = useAnimatedStyle(() => ({
    marginVertical: editingSharedValue.value * 20,
  }));

  const moduleContainerStyle = useAnimatedStyle(() => ({
    borderRadius: editingSharedValue.value * COVER_CARD_RADIUS * windowWith,
    shadowColor: colors.black,
    shadowOpacity: editingSharedValue.value * 0.35,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowRadius: 17,
    // TODO replace with card background color
    backgroundColor: 'white',
    transform: [{ translateX: dragX.value }],
  }));

  const moduleInnerContainerStyle = useAnimatedStyle(() => ({
    borderRadius: editingSharedValue.value * COVER_CARD_RADIUS * windowWith,
    overflow: 'hidden',
  }));

  const actionSectionBaseStyle = {
    position: 'absolute',
    top: height / 2 - buttonSize / 2,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 20,
  } as const;

  const moveButtonStyle = useAnimatedStyle(() => ({
    opacity: Math.max(
      0,
      editingSharedValue.value - Math.abs(dragX.value) / dragRightLimit,
    ),
  }));

  const leftSectionStyle = useAnimatedStyle(() => ({
    opacity: Math.max(
      0,
      dragX.value / dragRightLimit - selectionModeSharedValue.value,
    ),
  }));

  const selectionSectionStyle = useAnimatedStyle(() => ({
    opacity: selectionModeSharedValue.value,
  }));

  const rightSectionStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, dragX.value / dragLeftLimit),
  }));

  if (!visible && !editing) {
    return null;
  }

  return (
    <Animated.View
      style={[
        blockStyle,
        editing &&
          measuredHeight < buttonSize && {
            minHeight: buttonSize,
            justifyContent: 'center',
          },
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View style={moduleContainerStyle} onLayout={onLayout}>
          {/** this ViewTransition is only here because ios bug with shadow and overlow hidden */}
          <Animated.View style={moduleInnerContainerStyle}>
            <PressableNative
              onPress={editing ? onModulePress : undefined}
              disabledOpacity={1}
              accessible={editing}
              disabled={!editing || activeSection !== 'none'}
              accessibilityHint={
                editing
                  ? intl.formatMessage({
                      defaultMessage: `Press to edit this section of your profile`,
                      description: `Accessibility hint for the profile block container`,
                    })
                  : undefined
              }
            >
              {children}
              {!visible && (
                <View
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: `${colors.white}99`,
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
            </PressableNative>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {displayEditionButtons && (
        <>
          {!isLast && (
            <Animated.View
              style={[
                moveButtonStyle,
                actionSectionBaseStyle,
                { left: -buttonSize - 20 },
              ]}
              pointerEvents={activeSection !== 'none' ? 'none' : 'auto'}
            >
              <IconButton
                onPress={onMoveDown}
                disabled={activeSection !== 'none'}
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
          )}

          {!isFirst && (
            <Animated.View
              style={[
                moveButtonStyle,
                actionSectionBaseStyle,
                { right: -buttonSize - 20 },
              ]}
              pointerEvents={activeSection !== 'none' ? 'none' : 'auto'}
            >
              <IconButton
                onPress={onMoveUp}
                disabled={activeSection !== 'none'}
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
          )}

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
              disabled={activeSection !== 'left' || selectionMode}
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
                      defaultMessage: 'Hides the module in your webcard',
                      description:
                        'Accessibility hint for the hide button in the profile edition screen',
                    })
                  : intl.formatMessage({
                      defaultMessage: 'Shows the module in your webcard',
                      description:
                        'Accessibility hint for the show button in the profile edition screen',
                    })
              }
            />
            <IconButton
              onPress={onDuplicate}
              disabled={activeSection !== 'left' || selectionMode}
              icon="background"
              size={buttonSize}
              iconSize={iconSize}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Duplicate',
                description:
                  'Accessibility label for the duplicate button in the profile edition screen',
              })}
              accessibilityHint={intl.formatMessage({
                defaultMessage: 'Duplicates the module in your webcard',
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
              disabled={activeSection !== 'right'}
              icon="delete"
              size={buttonSize}
              iconSize={iconSize}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Delete',
                description:
                  'Accessibility label for the delete button in the profile edition screen',
              })}
              accessibilityHint={intl.formatMessage({
                defaultMessage: 'Deletes the module from your webcard',
                description:
                  'Accessibility hint for the delete button in the profile edition screen',
              })}
            />
          </Animated.View>
        </>
      )}
    </Animated.View>
  );
};

export default ProfileBlockContainer;
