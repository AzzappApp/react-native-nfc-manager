import { COVER_CARD_RADIUS } from '@azzapp/shared/lib/cardHelpers';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Transition } from 'react-transition-group';
import { colors } from '../../../theme';
import Header, { HEADER_HEIGHT } from '../../components/Header';
import useViewportSize, {
  insetBottom,
  insetTop,
} from '../../hooks/useViewportSize';
import FloatingIconButton from '../../ui/FloatingIconButton';
import PressableNative from '../../ui/PressableNative';
import TextHeaderButton from '../../ui/TextHeaderButton';
import ViewTransition from '../../ui/ViewTransition';
import ProfileScreenButtonBar from './ProfileScreenButtonBar';
import type { ReactNode } from 'react';
import type { LayoutChangeEvent, LayoutRectangle } from 'react-native';

type ProfileScreenLayoutProps = {
  ready: boolean;
  editing: boolean;
  saving: boolean;
  blocks: Array<{ id: number | string; children: ReactNode }>;
  userName: string;
  canSave: boolean;
  onCancel: () => void;
  onSave: () => void;
  onHome: () => void;
  onEdit: () => void;
  onEditBlock: (id: number | string) => void;
  onToggleFollow: (follow: boolean) => void;
  onClose: () => void;
};

const ProfileScreenLayout = ({
  ready,
  editing,
  saving,
  blocks,
  userName,
  canSave,
  onCancel,
  onSave,
  onHome,
  onEdit,
  onEditBlock,
  onToggleFollow,
  onClose,
}: ProfileScreenLayoutProps) => {
  const vp = useViewportSize();

  return (
    <View style={styles.container}>
      <Transition in={editing} timeout={EDIT_TRASITION_DURATION}>
        {state => {
          const isEditing = state === 'entering' || state === 'entered';
          return (
            <>
              <ViewTransition
                transitions={['height', 'marginTop']}
                transitionDuration={EDIT_TRASITION_DURATION}
                style={{
                  height: isEditing ? HEADER_HEIGHT : 0,
                  marginTop: isEditing ? vp`${insetTop}` : 0,
                }}
                disableAnimation={!ready}
              >
                <Header
                  title="Edit your profile"
                  leftButton={
                    !saving ? (
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
                transitions={['opacity']}
                transitionDuration={EDIT_TRASITION_DURATION}
                style={[
                  styles.closeButton,
                  {
                    top: vp`${insetTop} + ${16}`,
                    opacity: isEditing ? 0 : 1,
                  },
                ]}
                pointerEvents={isEditing ? 'none' : 'auto'}
                disableAnimation={!ready}
              >
                <FloatingIconButton icon="chevron" onPress={onClose} />
              </ViewTransition>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                  styles.scrollViewContainer,
                  { paddingBottom: vp`${insetBottom}` },
                ]}
                contentInsetAdjustmentBehavior="never"
              >
                {blocks.map(({ id, children }) => (
                  <ProfileBlockContainer
                    key={id}
                    editing={isEditing}
                    onEdit={() => onEditBlock(id)}
                    disableAnimation={!ready}
                  >
                    {children}
                  </ProfileBlockContainer>
                ))}
              </ScrollView>
              <ViewTransition
                transitions={['opacity', 'borderRadius']}
                transitionDuration={EDIT_TRASITION_DURATION}
                style={[
                  styles.buttonBar,
                  {
                    bottom: vp`${insetBottom} + ${40}`,
                    opacity: isEditing ? 0 : 1,
                  },
                ]}
                pointerEvents={isEditing ? 'none' : 'auto'}
                disableAnimation={!ready}
              >
                <ProfileScreenButtonBar
                  userName={userName}
                  onHome={onHome}
                  onEdit={onEdit}
                  onToggleFollow={onToggleFollow}
                />
              </ViewTransition>
            </>
          );
        }}
      </Transition>
    </View>
  );
};

export default ProfileScreenLayout;

type ProfileBlockContainerProps = {
  children: React.ReactNode;
  editing: boolean;
  disableAnimation?: boolean;
  onEdit: () => void;
};

const ProfileBlockContainer = ({
  editing,
  children,
  disableAnimation,
  onEdit,
}: ProfileBlockContainerProps) => {
  const intl = useIntl();

  const [contentLayout, setContentLayout] = useState<LayoutRectangle | null>();
  const onLayout = (e: LayoutChangeEvent) => {
    setContentLayout(e.nativeEvent.layout);
  };

  const contentHeight = contentLayout ? contentLayout.height : undefined;
  const contentWidth = contentLayout ? contentLayout.width : undefined;
  const editedHeight = contentHeight ? contentHeight * 0.5 : undefined;

  return (
    <ViewTransition
      transitions={['marginBottom', 'marginTop', 'height']}
      transitionDuration={EDIT_TRASITION_DURATION}
      style={{
        marginTop: editing ? 15 : 0,
        marginBottom: editing ? 15 : 0,
        height: editing ? editedHeight : contentHeight,
      }}
      disableAnimation={disableAnimation}
    >
      <ViewTransition
        transitions={['transform']}
        transitionDuration={EDIT_TRASITION_DURATION}
        style={{
          transform: [
            {
              translateY:
                editing && contentHeight != null ? -contentHeight / 4 : 0,
            },
          ],
          overflow: 'hidden',
        }}
        disableAnimation={disableAnimation}
      >
        <ViewTransition
          transitions={['transform', 'borderRadius', 'shadowOpacity']}
          transitionDuration={EDIT_TRASITION_DURATION}
          style={[
            {
              transform: [{ scale: editing ? 0.5 : 1 }],
              borderRadius:
                editing && contentWidth ? COVER_CARD_RADIUS * contentWidth : 0,
              shadowColor: colors.black,
              shadowOpacity: editing ? 0.35 : 0,
              shadowOffset: {
                width: 0,
                height: 8,
              },
              shadowRadius: 17,
            },
          ]}
          disableAnimation={disableAnimation}
          onLayout={onLayout}
        >
          {/** this ViewTransition is only here because ios bug with shadow and overlow hidden */}
          <ViewTransition
            transitions={['borderRadius']}
            transitionDuration={EDIT_TRASITION_DURATION}
            style={[
              {
                borderRadius:
                  editing && contentWidth
                    ? COVER_CARD_RADIUS * contentWidth
                    : 0,
                overflow: 'hidden',
              },
            ]}
            disableAnimation={disableAnimation}
          >
            <PressableNative
              onPress={editing ? onEdit : undefined}
              disabledOpacity={1}
              accessible={editing}
              disabled={!editing}
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
            </PressableNative>
          </ViewTransition>
        </ViewTransition>
      </ViewTransition>
    </ViewTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

const EDIT_TRASITION_DURATION = 220;
