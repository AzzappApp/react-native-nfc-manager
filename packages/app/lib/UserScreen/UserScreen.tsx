import { COVER_RATIO } from '@azzapp/shared/lib/imagesHelpers';
import { useMemo, useRef, useState } from 'react';
import { graphql, useFragment } from 'react-relay';
import CoverRenderer from '../components/CoverRenderer';
import { useRouter } from '../PlatformEnvironment';
import CoverEditPanel from './CoverEditPanel';
import ModuleEditorContext from './ModuleEditorContext';
import UserScreenLayout from './UserScreenLayout';
import type { ModuleEditor } from './ModuleEditorContext';
import type { UserScreenFramgent_user$key } from '@azzapp/relay/artifacts/UserScreenFramgent_user.graphql';
import type { UserScreenFramgent_viewer$key } from '@azzapp/relay/artifacts/UserScreenFramgent_viewer.graphql';
import type { ReactElement } from 'react';

type UserScreenProps = {
  user: UserScreenFramgent_user$key | null;
  viewer: UserScreenFramgent_viewer$key | null;
  canPlay?: boolean;
};

const UserScreen = ({
  user: userKey,
  canPlay = true,
  viewer: viewerKey,
}: UserScreenProps) => {
  const user = useFragment(
    graphql`
      fragment UserScreenFramgent_user on User {
        id
        userName
        card {
          id
          cover {
            ...CoverRenderer_cover
            ...CoverEditPanel_cover
            backgroundColor
          }
        }
      }
    `,
    userKey,
  );

  const viewer = useFragment(
    graphql`
      fragment UserScreenFramgent_viewer on Viewer {
        user {
          id
        }
      }
    `,
    viewerKey,
  );

  const canEdit = viewer?.user?.id === user?.id;

  const router = useRouter();
  const [creatingCard, setCreatingCard] = useState(
    canEdit && user?.card === null,
  );

  const [isEditing, setIsEditing] = useState(creatingCard);
  const [editedBlock, setEditedBlock] = useState<number | string | null>(
    creatingCard ? 'cover' : null,
  );
  const [canSave, setCanSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageIndex, setImageIndex] = useState<number | undefined>(undefined);

  const saveListenerRef = useRef<(() => void) | null>(null);
  const cancelListenerRef = useRef<
    (() => Promise<boolean>) | (() => void) | null
  >(null);

  const moduleEditor = useMemo<ModuleEditor>(
    () => ({
      setCanSave,
      onSaved() {
        setEditedBlock(null);
        setSaving(false);
        setCanSave(false);
        setCreatingCard(false);
        setImageIndex(0);
      },
      onSaveError() {
        setSaving(false);
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
      setSaving(true);
      saveListenerRef.current?.();
    }
  };

  const onEdit = () => {
    setIsEditing(true);
    setImageIndex(0);
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const onFollow = () => {};

  const onCancel = async () => {
    if (editedBlock) {
      const prevented = await cancelListenerRef.current?.();
      if (prevented === true) {
        return;
      }
      setEditedBlock(null);
      setImageIndex(0);
    } else {
      setIsEditing(false);
      setImageIndex(undefined);
    }
  };

  if (!user?.id) {
    // TODO redirect ?
    return null;
  }

  const cardBackgroundColor = user?.card?.cover.backgroundColor ?? '#FFF';

  const blocks: Array<{
    key: number | string;
    measure(width: number): number;
    blockContent: ReactElement;
    editPanel: ReactElement;
  }> = [
    {
      key: 'cover',
      blockContent: (
        <CoverRenderer
          cover={user.card?.cover}
          userName={user.userName}
          imageIndex={imageIndex}
          fullScreen
          isEditing={isEditing}
          isEditedBlock={editedBlock === 'cover'}
          play={imageIndex === undefined && canPlay}
          hideBorderRadius={!isEditing}
        />
      ),
      editPanel: (
        <CoverEditPanel
          userId={user.id}
          cardId={user.card?.id}
          cover={user.card?.cover}
          imageIndex={imageIndex}
          setImageIndex={setImageIndex}
        />
      ),
      measure: width => width / COVER_RATIO,
    },
  ];

  return (
    <ModuleEditorContext.Provider value={moduleEditor}>
      <UserScreenLayout
        creatingCard={creatingCard}
        isEditing={isEditing}
        saving={saving}
        canSave={canSave}
        canEdit={canEdit}
        editedBlock={editedBlock}
        cardBackgroundColor={cardBackgroundColor}
        blocks={blocks}
        onBack={onBack}
        onEdit={onEdit}
        onCancel={onCancel}
        onSave={onSave}
        onFollow={onFollow}
        setEditedBlock={setEditedBlock}
      />
    </ModuleEditorContext.Provider>
  );
};

export default UserScreen;
