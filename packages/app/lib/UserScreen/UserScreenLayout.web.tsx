import { EventEmitter } from 'events';
import { COVER_RATIO } from '@azzapp/shared/lib/imagesHelpers';
import { cloneElement, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors } from '../../theme';
import FloatingIconButton from '../components/FloatingIconButton';
import Header, { HEADER_HEIGHT } from '../components/Header';
import TextHeaderButton from '../components/TextHeaderButton';
import useSafeAreaInsets from '../hooks/useSafeAreaInsets.web';
import UserScreenButtonBar from './UserScreenButtonBar';
import type { ReactElement } from 'react';

type UserScreenLayoutProps = {
  userId: string;
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
  userId,
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

  const editedWidth = (contentHeight / 2) * COVER_RATIO;

  const displayedBlocks = editedBlock
    ? blocks.filter(block => block.key === editedBlock)
    : blocks;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isEditing ? '#FFF' : cardBackgroundColor },
      ]}
    >
      {isEditing && (
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
      )}
      {!isEditing && (
        <>
          <FloatingIconButton
            icon="chevron"
            onPress={onBack}
            style={styles.closeButton}
          />
          <UserScreenButtonBar
            userId={userId}
            canEdit={canEdit}
            onHome={onBack}
            onEdit={onEdit}
            onFollow={onFollow}
            style={styles.buttonBar}
          />
        </>
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContainer}
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
            windowWidth={windowWidth}
            editedWidth={editedWidth}
            measure={measure}
            onPress={() => setEditedBlock(key)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default UserScreenLayout;

type BlockProps = {
  blockContent: ReactElement;
  editPanel: ReactElement;
  isEditing: boolean;
  isEditedBlock: boolean;
  windowWidth: number;
  editedWidth: number;
  measure(width: number): number;
  onPress: () => void;
};

const Block = ({
  blockContent,
  editPanel,
  isEditing,
  isEditedBlock,
  windowWidth,
  editedWidth,
  measure,
  onPress,
}: BlockProps) => {
  const eventEmitter = useRef(new EventEmitter()).current;

  const targetWidth = editedWidth + (isEditedBlock ? 20 : 0);

  return (
    <>
      <View
        style={[
          styles.block,
          isEditing && styles.blockEditing,
          isEditing
            ? {
                width: targetWidth,
                height: measure(targetWidth),
                marginTop: 20,
                borderRadius: '6%' as any,
              }
            : { width: '100vw' },
        ]}
      >
        <View
          style={[
            { width: '100vw' },
            isEditing && {
              transform: [{ scale: targetWidth / windowWidth }],
              // @ts-expect-error transformOrigin is web only
              transformOrigin: '0 0',
            },
          ]}
        >
          {cloneElement(blockContent, {
            eventEmitter,
            style: [blockContent.props.style],
          })}
          {isEditing && !isEditedBlock && (
            <Pressable
              onPress={onPress}
              style={({ pressed }) => [
                styles.blockPressable,
                pressed && { opacity: 0.6 },
              ]}
            />
          )}
        </View>
      </View>
      {isEditedBlock && (
        <View style={styles.blockEditor}>
          {cloneElement(editPanel, { eventEmitter })}
        </View>
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
    top: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    zIndex: 1,
  },
  buttonBar: {
    position: 'absolute',
    start: 15,
    end: 15,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    bottom: 'calc(40px + env(safe-area-inset-bottom, 0px))',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
