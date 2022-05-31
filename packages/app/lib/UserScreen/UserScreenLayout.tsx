import { EventEmitter } from 'events';
import { COVER_RATIO } from '@azzapp/shared/lib/imagesFormats';
import { cloneElement, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withTiming,
  Easing,
  interpolateColor,
  FadeOut,
  FadeIn,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import FloatingIconButton from '../components/FloatingIconButton';
import Header, { HEADER_HEIGHT } from '../components/Header';
import TextHeaderButton from '../components/TextHeaderButton';
import UserScreenButtonBar from './UserScreenButtonBar';
import type { ReactElement } from 'react';
import type { SharedValue } from 'react-native-reanimated';

type UserScreenLayoutProps = {
  creatingCard: boolean;
  isEditing: boolean;
  saving: boolean;
  canSave: boolean;
  canEdit: boolean;
  editedBlock: number | string | null;
  cardBackgroundColor: string;
  blocks: Array<{
    key: number | string;
    blockContent: ReactElement;
    editPanel: ReactElement;
    measure(width: number): number;
  }>;
  onBack: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onFollow: () => void;
  setEditedBlock: (block: number | string) => void;
};

const UserScreenLayout = ({
  creatingCard,
  isEditing,
  saving,
  canSave,
  canEdit,
  editedBlock,
  cardBackgroundColor,
  blocks,
  onBack,
  onEdit,
  onCancel,
  onSave,
  onFollow,
  setEditedBlock,
}: UserScreenLayoutProps) => {
  const safeAreaInsets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const contentHeight =
    windowHeight - HEADER_HEIGHT - safeAreaInsets.top - safeAreaInsets.bottom;

  const isEditingAnimatedValue = useSharedValue(0);

  useEffect(() => {
    isEditingAnimatedValue.value = withTiming(isEditing ? 1 : 0, {
      duration: 300,
      easing: Easing.linear,
    });
  }, [editedBlock, isEditing, isEditingAnimatedValue]);

  const editedWidth = (contentHeight / 2) * COVER_RATIO;

  const headerStyles = useAnimatedStyle(() => ({
    height: HEADER_HEIGHT * isEditingAnimatedValue.value,
    marginTop: safeAreaInsets.top * isEditingAnimatedValue.value,
  }));

  const containerStyles = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      isEditingAnimatedValue.value,
      [0, 1],
      [cardBackgroundColor, '#FFF'],
      'RGB',
    ),
  }));

  const buttonStyles = useAnimatedStyle(() => ({
    opacity: 1 - isEditingAnimatedValue.value,
  }));

  const displayedBlocks = editedBlock
    ? blocks.filter(block => block.key === editedBlock)
    : blocks;
  return (
    <Animated.View style={[styles.container, containerStyles]}>
      <Animated.View style={headerStyles}>
        <Header
          title="Edit your profile"
          leftButton={
            !creatingCard && !saving ? (
              <TextHeaderButton text="Cancel" onPress={onCancel} />
            ) : null
          }
          rightButton={
            saving ? (
              <ActivityIndicator style={{ marginRight: 10 }} />
            ) : canSave ? (
              <TextHeaderButton text="Save" onPress={onSave} />
            ) : null
          }
        />
      </Animated.View>
      {!isEditing && (
        <>
          <Animated.View
            style={[
              styles.closeButton,
              { top: safeAreaInsets.top + 16 },
              buttonStyles,
            ]}
          >
            <FloatingIconButton icon="chevron" onPress={onBack} />
          </Animated.View>
          <Animated.View
            style={[
              styles.buttonBar,
              { bottom: safeAreaInsets.bottom + 40 },
              buttonStyles,
            ]}
          >
            <UserScreenButtonBar
              canEdit={canEdit}
              onHome={onBack}
              onEdit={onEdit}
              onFollow={onFollow}
            />
          </Animated.View>
        </>
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContainer,
          { paddingBottom: safeAreaInsets.bottom },
        ]}
        scrollEnabled={editedBlock == null}
        contentInsetAdjustmentBehavior="never"
      >
        {displayedBlocks.map(({ blockContent, editPanel, key, measure }) => (
          <Block
            key={key}
            blockContent={blockContent}
            editPanel={editPanel}
            isEditing={isEditing}
            isEditedBlock={editedBlock === key}
            isEditingAnimatedValue={isEditingAnimatedValue}
            windowWidth={windowWidth}
            editedWidth={editedWidth}
            measure={measure}
            onPress={() => setEditedBlock(key)}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
};

export default UserScreenLayout;

type BlockProps = {
  blockContent: ReactElement;
  editPanel: ReactElement;
  isEditing: boolean;
  isEditedBlock: boolean;
  isEditingAnimatedValue: SharedValue<number>;
  windowWidth: number;
  editedWidth: number;
  measure(width: number): number;
  onPress: () => void;
};

const Block = ({
  measure,
  blockContent,
  editPanel,
  isEditing,
  isEditedBlock,
  isEditingAnimatedValue,
  windowWidth,
  editedWidth,
  onPress,
}: BlockProps) => {
  const eventEmitter = useRef(new EventEmitter()).current;

  const blockHeight = measure(windowWidth);
  const isEditingHeight = measure(editedWidth);
  const isEditedBlockWithDelta = 20;
  const isEditedBlockHeightDelta = measure(isEditedBlockWithDelta);
  const isEditedBlockAnimatedValue = useSharedValue(0);

  useEffect(() => {
    isEditedBlockAnimatedValue.value = withSpring(isEditedBlock ? 1 : 0, {
      overshootClamping: true,
    });
  }, [isEditedBlock, isEditedBlockAnimatedValue]);

  const blockStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX:
            ((editedWidth +
              isEditedBlockWithDelta * isEditedBlockAnimatedValue.value -
              windowWidth) /
              2) *
            isEditingAnimatedValue.value,
        },
        {
          translateY:
            ((isEditingHeight +
              isEditedBlockHeightDelta * isEditedBlockAnimatedValue.value -
              blockHeight) /
              2) *
            isEditingAnimatedValue.value,
        },
        {
          scale: interpolate(
            isEditingAnimatedValue.value,
            [0, 1],
            [
              1,
              (editedWidth +
                isEditedBlockWithDelta * isEditedBlockAnimatedValue.value) /
                windowWidth,
            ],
            {
              extrapolateRight: Extrapolation.CLAMP,
            },
          ),
        },
      ],
    };
  });

  const blockContainerStyles = useAnimatedStyle(() => {
    const width = interpolate(
      isEditingAnimatedValue.value,
      [0, 1],
      [
        windowWidth,
        editedWidth + isEditedBlockWithDelta * isEditedBlockAnimatedValue.value,
      ],
      {
        extrapolateRight: Extrapolation.CLAMP,
      },
    );

    const height = interpolate(
      isEditingAnimatedValue.value,
      [0, 1],
      [
        blockHeight,
        isEditingHeight +
          isEditedBlockHeightDelta * isEditedBlockAnimatedValue.value,
      ],
      {
        extrapolateRight: Extrapolation.CLAMP,
      },
    );

    const marginTop = interpolate(
      isEditingAnimatedValue.value,
      [0, 1],
      [0, 20],
    );

    return {
      width,
      height,
      marginTop,
    };
  });

  return (
    <>
      <Animated.View
        style={[
          styles.block,
          isEditing && styles.blockEditing,
          blockContainerStyles,
        ]}
        exiting={FadeOut}
      >
        <Animated.View style={[{ width: windowWidth }, blockStyles]}>
          {cloneElement(blockContent, { eventEmitter })}
          {isEditing && !isEditedBlock && (
            <Pressable
              onPress={onPress}
              style={({ pressed }) => [
                styles.blockPressable,
                pressed && { opacity: 0.6 },
              ]}
            />
          )}
        </Animated.View>
      </Animated.View>
      {isEditedBlock && (
        <Animated.View
          style={styles.blockEditor}
          entering={FadeIn}
          exiting={FadeOut}
        >
          {cloneElement(editPanel, { eventEmitter })}
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    start: 15,
    zIndex: 1,
  },
  buttonBar: {
    position: 'absolute',
    start: 15,
    end: 15,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContainer: {
    flexGrow: 1,
  },
  block: {
    alignSelf: 'center',
  },
  blockEditing: {
    shadowColor: colors.dark,
    shadowOpacity: 0.21,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
  },
  blockPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    backgroundColor: '#FFF',
  },
  blockEditor: { marginTop: 20, flex: 1 },
});
