import { useMemo, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { graphql } from 'react-relay';
import CoverRenderer from '../components/CoverRenderer';
import EditButton from '../components/EditButton';
import Header from '../components/Header';
import IconHeaderButton from '../components/IconHeaderButton';
import TextHeaderButton from '../components/TextHeaderButton';
import { useRouter } from '../PlatformEnvironment';
import CoverEditPanel from './CoverEditPanel';
import ModuleEditorContext from './ModuleEditorContext';
import type { UserScreenQuery$data } from './__generated__/UserScreenQuery.graphql';
import type { ModuleEditor } from './ModuleEditorContext';
import type { ReactElement } from 'react';

export const userScreenQuery = graphql`
  query UserScreenQuery($userId: ID!) {
    viewer {
      user {
        id
      }
    }
    user: node(id: $userId) {
      ... on User {
        id
        card {
          id
          cover {
            ...CoverRenderer_cover
            ...CoverEditPanel_cover
          }
        }
      }
    }
  }
`;

type UserScreenProps = {
  data: UserScreenQuery$data;
  params: { userId: string };
};

const UserScreen = ({ data: { user, viewer } }: UserScreenProps) => {
  const router = useRouter();
  const canEdit = !!user && user?.id === viewer.user?.id;
  const [creatingCard, setCreatingCard] = useState(
    canEdit && user.card === null,
  );
  const [isEditing, setIsEditing] = useState(creatingCard);
  const [editedBlock, setEditedBlock] = useState<number | 'cover' | null>(
    creatingCard ? 'cover' : null,
  );
  const [hasUnsavedChange, setCanSave] = useState(false);

  const saveListenerRef = useRef<(() => void) | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  const cancelListenerRef = useRef<(() => Promise<boolean> | void) | null>(
    null,
  );

  const moduleEditor = useMemo<ModuleEditor>(
    () => ({
      setCanSave,
      onSaved() {
        setEditedBlock(null);
        setCanSave(false);
        setCreatingCard(false);
      },
      setSaveListener(save) {
        saveListenerRef.current = save;
        return {
          dispose() {
            if (saveListenerRef.current === save) {
              saveListenerRef.current = null;
            }
          },
        };
      },
      setCancelListener(cancel) {
        cancelListenerRef.current = cancel;
        return {
          dispose() {
            if (cancelListenerRef.current === cancel) {
              saveListenerRef.current = null;
            }
          },
        };
      },
    }),
    [],
  );

  const onBack = () => {
    router.back();
  };

  const onSave = () => {
    if (editedBlock) {
      saveListenerRef.current?.();
    }
  };

  const onEdit = () => {
    setIsEditing(true);
  };

  const onCancel = async () => {
    if (editedBlock) {
      const prevented = await cancelListenerRef.current?.();
      if (prevented) {
        return;
      }
      setEditedBlock(null);
    } else {
      setIsEditing(false);
    }
  };

  let leftButton: ReactElement | null = null;
  let rightButton: ReactElement | null = null;
  if (editedBlock) {
    if (!creatingCard) {
      leftButton = <TextHeaderButton text="Cancel" onPress={onCancel} />;
    }
    if (hasUnsavedChange) {
      rightButton = (
        <TextHeaderButton text="Save" onPress={onSave} whiteButton />
      );
    }
  } else if (isEditing) {
    leftButton = <TextHeaderButton text="Cancel" onPress={onCancel} />;
  } else {
    leftButton = <IconHeaderButton icon="chevron" onPress={onBack} />;
    rightButton = <IconHeaderButton icon="edit" circled onPress={onEdit} />;
  }

  if (!user?.id) {
    // TODO redirect
    return null;
  }

  return (
    <ModuleEditorContext.Provider value={moduleEditor}>
      <SafeAreaView
        style={[styles.container, isEditing && styles.containerEditing]}
      >
        <Header
          title="Profile"
          leftButton={leftButton}
          rightButton={rightButton}
          dark={isEditing}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContainer}
          scrollEnabled={editedBlock == null}
        >
          {typeof editedBlock !== 'number' && (
            <CoverRenderer
              cover={user.card?.cover}
              userId={user.id}
              style={isEditing ? styles.coverEditing : styles.cover}
              fullScreen={!isEditing}
            />
          )}
          {isEditing && editedBlock == null && (
            <EditButton
              onPress={() => setEditedBlock('cover')}
              style={styles.editButton}
            />
          )}
          {editedBlock === 'cover' && (
            <CoverEditPanel
              userId={user.id}
              style={{ flex: 1 }}
              cover={user.card?.cover}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </ModuleEditorContext.Provider>
  );
};

export default UserScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  containerEditing: {
    backgroundColor: 'black',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContainer: {
    flexGrow: 1,
  },
  cover: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  coverEditing: {
    width: '50%',
    alignSelf: 'center',
    marginTop: 20,
  },
  editButton: {
    alignSelf: 'center',
    marginVertical: 20,
  },
});
