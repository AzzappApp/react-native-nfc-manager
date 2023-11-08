import { useState, useEffect, useMemo, useContext } from 'react';
import { useIntl } from 'react-intl';
import {
  PixelRatio,
  StyleSheet,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { COVER_CARD_RADIUS } from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import {
  type ModuleRenderInfo,
  measureModuleHeight,
} from '#components/cardModules/CardModuleRenderer';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import {
  BUTTON_SIZE,
  EDIT_TRANSITION_DURATION,
  useProfileEditScale,
} from './profileScreenHelpers';
import { ProfileScreenScrollViewContext } from './ProfileScreenScrollView';
import {
  useEditTransition,
  useSelectionModeTransition,
} from './ProfileScreenTransitions';
import type { CardStyle } from '@azzapp/shared/cardHelpers';

export type ProfileBlockContainerProps = {
  /**
   * id of the block
   */
  id: string;
  /**
   * the index of the block in the list
   */
  index: number;
  /**
   * The children of the container
   */
  children: React.ReactNode;
  /**
   * Whether the profile is in edit mode
   */
  editing: boolean;
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

  moduleRenderInfo?: ModuleRenderInfo;
  cardStyle?: CardStyle | null;
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
const ProfileBlockContainer = ({
  id,
  index,
  editing,
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
  moduleRenderInfo,
  cardStyle,
  onModulePress,
  onMoveUp,
  onMoveDown,
  onRemove,
  onDuplicate,
  onToggleVisibility,
  onSelect,
}: ProfileBlockContainerProps) => {
  const intl = useIntl();

  const { width: windowWidth } = useWindowDimensions();
  const [measuredHeight, setMeasuredHeight] = useState(0);

  const editScale = useProfileEditScale();

  const buttonSize = BUTTON_SIZE / editScale;
  const iconSize = 24 / editScale;

  const editingHeight =
    measuredHeight < buttonSize ? buttonSize : measuredHeight;

  const editingTransition = useEditTransition();

  const {
    registerBlock,
    addLayoutChangedListener,
    getBlockPositions,
    setBlockInfos,
    isLayoutReady,
  } = useContext(ProfileScreenScrollViewContext)!;

  useEffect(
    () =>
      registerBlock(id, {
        index,
        visible,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, registerBlock],
  );

  useEffect(() => {
    let cancelled = false;
    if (moduleRenderInfo) {
      measureModuleHeight(moduleRenderInfo, cardStyle, windowWidth).then(
        height => {
          if (!cancelled) {
            setMeasuredHeight(PixelRatio.roundToNearestPixel(height));
          }
        },
      );
    }
    return () => {
      cancelled = true;
    };
  }, [moduleRenderInfo, cardStyle, windowWidth]);

  useEffect(() => {
    if (measuredHeight === 0) {
      return;
    }
    setBlockInfos(id, {
      index,
      visible,
      height: measuredHeight,
    });
  }, [measuredHeight, id, index, setBlockInfos, visible]);

  const { position, editPosition } = getBlockPositions(id) ?? {};
  const positionSharedValue = useSharedValue(position);
  const editPositionSharedValue = useSharedValue(editPosition);
  const layoutReadySharedValue = useSharedValue(
    id === 'cover' || isLayoutReady() ? 1 : 0,
  );
  const [hasBeenDisplayed, setHasBeenDisplayed] = useState(id === 'cover');
  useEffect(
    () =>
      addLayoutChangedListener(() => {
        const positions = getBlockPositions(id);
        if (
          !positions ||
          positionSharedValue.value === undefined ||
          editPositionSharedValue.value === undefined ||
          !editingTransition?.value ||
          !isLayoutReady() ||
          id === 'cover'
        ) {
          positionSharedValue.value = positions?.position;
          editPositionSharedValue.value = positions?.editPosition;
        } else {
          positionSharedValue.value = withTiming(positions.position, {
            duration: EDIT_TRANSITION_DURATION,
          });
          editPositionSharedValue.value = withTiming(positions.editPosition, {
            duration: EDIT_TRANSITION_DURATION,
          });
        }
        if (isLayoutReady() && id !== 'cover') {
          layoutReadySharedValue.value = withTiming(
            1,
            { duration: EDIT_TRANSITION_DURATION },
            () => {
              runOnJS(setHasBeenDisplayed)(true);
            },
          );
        }
      }),
    [
      addLayoutChangedListener,
      editPositionSharedValue,
      getBlockPositions,
      id,
      positionSharedValue,
      isLayoutReady,
      layoutReadySharedValue,
      editingTransition,
    ],
  );

  const dragX = useSharedValue(0);
  const dragRightLimit = (windowWidth * (1 - editScale)) / 2;
  const dragLeftLimit = (windowWidth * (editScale - 1)) / 2;

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

  const selectionModeTransition = useSelectionModeTransition();

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
      editing,
      panGestureActive,
      selectionMode,
    ],
  );

  const touchActive = useSharedValue(0);
  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .enabled(editing && activeSection === 'none')
        .onBegin(() => {
          touchActive.value = withTiming(1);
        })
        .onStart(() => {
          runOnJS(onModulePress)();
        })
        .onFinalize(() => {
          touchActive.value = withTiming(0);
        }),
    [activeSection, editing, onModulePress, touchActive],
  );

  const blockStyle = useAnimatedStyle(() => {
    const position = positionSharedValue.value;
    const editPosition = editPositionSharedValue.value;
    if (position === undefined || editPosition === undefined) {
      return {
        display: 'none',
      };
    }
    const editTransitionValue = editingTransition?.value ?? 0;
    return {
      display: 'flex',
      position: 'absolute',
      width: windowWidth,
      height: interpolate(
        editingTransition?.value ?? 0,
        [0, 1],
        [measuredHeight, editingHeight],
      ),
      zIndex: visible ? 0 : editTransitionValue > 0 ? 0 : -1,
      left: 0,
      top: interpolate(
        editingTransition?.value ?? 0,
        [0, 1],
        [position, editPosition],
      ),
      opacity:
        layoutReadySharedValue.value * (visible ? 1 : editTransitionValue),
    };
  });

  const appearance = useColorScheme() ?? 'light';
  const moduleContainerStyle = useAnimatedStyle(() => ({
    borderRadius:
      (editingTransition?.value ?? 0) * COVER_CARD_RADIUS * windowWidth,
    overflow: 'visible',
    backgroundColor,
    transform: [{ translateX: dragX.value }],
    position: 'absolute',
    width: windowWidth,
  }));

  const moduleInnerContainerStyle = useAnimatedStyle(() => ({
    borderRadius:
      (editingTransition?.value ?? 0) * COVER_CARD_RADIUS * windowWidth - 2,
    overflow: 'hidden',
    opacity: interpolate(touchActive.value, [0, 1], [1, 0.2]),
  }));

  const actionSectionBaseStyle = {
    position: 'absolute',
    top: Math.max(0, measuredHeight / 2 - buttonSize / 2),
    alignItems: 'center',
    flexDirection: 'row',
    gap: 20,
  } as const;

  const moveButtonStyle = useAnimatedStyle(() => ({
    opacity: Math.max(
      0,
      (editingTransition?.value ?? 0) - Math.abs(dragX.value) / dragRightLimit,
    ),
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

  return (
    <Animated.View
      style={blockStyle}
      exiting={id !== 'cover' && hasBeenDisplayed ? FadeOut : undefined}
      entering={id !== 'cover' && hasBeenDisplayed ? FadeIn : undefined}
    >
      <GestureDetector gesture={Gesture.Race(tapGesture, panGesture)}>
        <Animated.View
          style={[moduleContainerStyle, editing && shadow(appearance)]}
        >
          {/** this View is only here because ios bug with shadow and overlow hidden */}
          <Animated.View
            style={moduleInnerContainerStyle}
            accessibilityHint={
              editing
                ? intl.formatMessage({
                    defaultMessage: `Press to edit this section of your profile`,
                    description: `Accessibility hint for the profile block container`,
                  })
                : undefined
            }
          >
            <View pointerEvents={editing ? 'none' : 'box-none'}>
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
          {!isLast && (
            <Animated.View
              style={[
                moveButtonStyle,
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
