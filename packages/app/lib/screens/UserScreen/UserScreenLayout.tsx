import { EventEmitter } from 'events';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/lib/cardHelpers';
import { cloneElement, useRef } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Transition } from 'react-transition-group';
import { colors } from '../../../theme';
import Header, { HEADER_HEIGHT } from '../../components/Header';
import useViewportSize, {
  insetBottom,
  insetTop,
  VW100,
} from '../../hooks/useViewportSize';
import FloatingIconButton from '../../ui/FloatingIconButton';
import TextHeaderButton from '../../ui/TextHeaderButton';
import ViewTransition from '../../ui/ViewTransition';
import UserScreenButtonBar from './UserScreenButtonBar';
import type { ReactElement } from 'react';
import type { ViewStyle } from 'react-native';

type UserScreenLayoutProps = {
  userName: string;
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
    sizeStyle: { width: number | string; height: number | string };
    measure(width: number): number;
  }>;
  isFollowing: boolean;
  onBack: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onFollow: () => void;
  setEditedBlock: (block: number | string) => void;
};

const UserScreenLayout = ({
  userName,
  creatingCard,
  isEditing,
  saving,
  canSave,
  canEdit,
  editedBlock,
  cardBackgroundColor,
  isFollowing,
  blocks,
  onBack,
  onEdit,
  onCancel,
  onSave,
  onFollow,
  setEditedBlock,
}: UserScreenLayoutProps) => {
  // We use the vp system for most element, but for computing the edited layout and animation
  // we compute the sizes from window dimensions and safe area insets

  const vp = useViewportSize();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets =
    // TODO: remove this eslint-disable when the conditional hook usage is fixed
    // eslint-disable-next-line react-hooks/rules-of-hooks
    Platform.OS === 'web' ? { top: 0, bottom: 0 } : useSafeAreaInsets();
  const contentHeight =
    windowHeight - HEADER_HEIGHT - insets.top - insets.bottom;
  // We want the cover to take half of the available space when editing
  const editingWidth = ((contentHeight - 20) / 2) * COVER_RATIO;

  const displayedBlocks = editedBlock
    ? blocks.filter(block => block.key === editedBlock)
    : blocks;

  return (
    <ViewTransition
      transitionDuration={TRANSITIONS_DURATION}
      transitions={['backgroundColor']}
      style={[
        styles.container,
        { backgroundColor: isEditing ? '#fff' : cardBackgroundColor },
      ]}
    >
      <ViewTransition
        style={
          isEditing
            ? { height: HEADER_HEIGHT, marginTop: vp`${insetTop}` }
            : { height: 0, marginTop: 0 }
        }
        transitionDuration={TRANSITIONS_DURATION}
        transitions={['height', 'marginTop']}
      >
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
      </ViewTransition>
      <ViewTransition
        style={[
          styles.closeButton,
          { top: vp`${insetTop} + ${16}`, opacity: isEditing ? 0 : 1 },
        ]}
        transitionDuration={TRANSITIONS_DURATION}
        transitions={['opacity']}
        pointerEvents={isEditing ? 'none' : 'auto'}
      >
        <FloatingIconButton icon="chevron" onPress={onBack} />
      </ViewTransition>
      <ViewTransition
        style={[
          styles.buttonBar,
          {
            bottom: vp`${insetBottom} + ${40}`,
            opacity: isEditing ? 0 : 1,
          },
        ]}
        transitionDuration={TRANSITIONS_DURATION}
        transitions={['opacity']}
        pointerEvents={isEditing ? 'none' : 'auto'}
      >
        <UserScreenButtonBar
          userName={userName}
          isFollowing={isFollowing}
          canEdit={canEdit}
          onHome={onBack}
          onEdit={onEdit}
          onFollow={onFollow}
        />
      </ViewTransition>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContainer,
          { paddingBottom: vp`${insetBottom}` },
        ]}
        scrollEnabled={editedBlock == null}
        contentInsetAdjustmentBehavior="never"
      >
        {displayedBlocks.map(
          ({ blockContent, editPanel, key, sizeStyle, measure }) => (
            <Block
              key={key}
              blockContent={blockContent}
              editPanel={editPanel}
              isEditing={isEditing}
              isEditedBlock={editedBlock === key}
              blockWidth={windowWidth}
              editingWidth={editingWidth}
              sizeStyle={sizeStyle}
              measure={measure}
              onPress={() => setEditedBlock(key)}
            />
          ),
        )}
      </ScrollView>
    </ViewTransition>
  );
};

export default UserScreenLayout;

const TRANSITIONS_DURATION = 300;

type BlockProps = {
  blockContent: ReactElement;
  editPanel: ReactElement;
  isEditing: boolean;
  isEditedBlock: boolean;
  blockWidth: number;
  editingWidth: number;
  sizeStyle: { width: number | string; height: number | string };
  measure(width: number): number;
  onPress: () => void;
};

const Block = ({
  blockContent,
  editPanel,
  isEditing,
  isEditedBlock,
  blockWidth,
  editingWidth,
  sizeStyle,
  measure,
  onPress,
}: BlockProps) => {
  const eventEmitter = useRef(new EventEmitter()).current;
  const vp = useViewportSize();

  const blockHeight = measure(blockWidth);
  const editingdHeight = measure(editingWidth);
  const isEditedBlockWidth = editingWidth + 20;
  const isEditedBlockHeight = measure(isEditedBlockWidth);

  const createScaleTransform = (
    desiredWidth: number,
    desiredHeight: number,
  ): ViewStyle => ({
    transform: [
      { translateX: (desiredWidth - blockWidth) / 2 },
      { translateY: (desiredHeight - blockHeight) / 2 },
      { scale: desiredWidth / blockWidth },
    ],
  });

  const editPanelRef = useRef<any>();

  return (
    <>
      <ViewTransition
        style={[
          styles.block,
          sizeStyle,
          { marginTop: 0, borderRadius: 0 },
          isEditing && styles.blockEditing,
          isEditing && {
            width: editingWidth,
            height: editingdHeight,
            marginTop: 20,
            borderRadius: editingWidth * COVER_CARD_RADIUS,
          },
          isEditedBlock && {
            width: isEditedBlockWidth,
            height: isEditedBlockHeight,
            borderRadius: isEditedBlockWidth * COVER_CARD_RADIUS,
          },
        ]}
        transitionDuration={TRANSITIONS_DURATION}
        transitions={[
          'width',
          'height',
          'marginTop',
          'shadowOpacity',
          'borderRadius',
        ]}
      >
        <ViewTransition
          style={[
            {
              width: vp`${VW100}`,
              transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
            },
            isEditing && createScaleTransform(editingWidth, editingdHeight),
            isEditedBlock &&
              createScaleTransform(isEditedBlockWidth, isEditedBlockHeight),
          ]}
          transitionDuration={TRANSITIONS_DURATION}
          transitions={['transform']}
        >
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
        </ViewTransition>
      </ViewTransition>
      <Transition
        in={isEditedBlock}
        mountOnEnter
        unmountOnExit
        timeout={TRANSITIONS_DURATION}
        nodeRef={editPanelRef}
      >
        {state => (
          <ViewTransition
            style={[
              styles.blockEditor,
              { opacity: state === 'entering' || state === 'entered' ? 1 : 0 },
            ]}
            transitionDuration={TRANSITIONS_DURATION}
            transitions={['opacity']}
            ref={editPanelRef}
          >
            {cloneElement(editPanel, { eventEmitter })}
          </ViewTransition>
        )}
      </Transition>
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
    width: '100%',
    paddingHorizontal: 15,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContainer: {
    flexGrow: 1,
  },
  block: {
    alignSelf: 'center',
    overflow: 'hidden',
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
