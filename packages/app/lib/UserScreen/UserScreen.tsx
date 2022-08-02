import { COVER_RATIO } from '@azzapp/shared/lib/imagesHelpers';
import { useMemo, useRef, useState } from 'react';
import { graphql, useFragment } from 'react-relay';
import CoverRenderer from '../components/CoverRenderer';
import useViewportSize, { VW100 } from '../hooks/useViewportSize';
import CoverEditPanel from './CoverEditPanel';
import ModuleEditorContext from './ModuleEditorContext';
import UserScreenLayout from './UserScreenLayout';
import type { CoverHandle } from '../components/CoverRenderer/CoverRenderer';
import type { ModuleEditor } from './ModuleEditorContext';
import type { UserScreenFramgent_user$key } from '@azzapp/relay/artifacts/UserScreenFramgent_user.graphql';
import type { UserScreenFramgent_viewer$key } from '@azzapp/relay/artifacts/UserScreenFramgent_viewer.graphql';
import type { ReactElement, Ref } from 'react';

export type UserScreenProps = {
  user: UserScreenFramgent_user$key;
  viewer: UserScreenFramgent_viewer$key | null;
  ready?: boolean;
  hideCover?: boolean;
  initialImageIndex?: number;
  initialVideoTime?: number;
  coverRef?: Ref<CoverHandle>;
  onBack: () => void;
  onCoverReadyForDisplay?: () => void;
};

const UserScreen = ({
  user: userKey,
  viewer: viewerKey,
  ready = true,
  hideCover,
  initialImageIndex,
  initialVideoTime,
  coverRef,
  onBack,
  onCoverReadyForDisplay,
}: UserScreenProps) => {
  const user = useFragment(
    graphql`
      fragment UserScreenFramgent_user on User
      @argumentDefinitions(
        screenWidth: {
          type: "Float!"
          provider: "../providers/ScreenWidth.relayprovider"
        }
      ) {
        id
        userName
        card {
          id
          cover {
            ...CoverRenderer_cover @arguments(width: $screenWidth)
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

  const [creatingCard, setCreatingCard] = useState(
    canEdit && user?.card === null,
  );

  const [isEditing, setIsEditing] = useState(creatingCard);
  const [editedBlock, setEditedBlock] = useState<number | string | null>(
    creatingCard ? 'cover' : null,
  );
  const [canSave, setCanSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialRenderData, setInitialRenderData] = useState<{
    initialImageIndex: number;
    initialVideoTime: number;
  } | null>({
    initialImageIndex: initialImageIndex ?? 0,
    initialVideoTime: initialVideoTime ?? 0,
  });
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

  const onSave = () => {
    if (editedBlock) {
      setSaving(true);
      saveListenerRef.current?.();
    }
  };

  const onEdit = () => {
    setIsEditing(true);
    setInitialRenderData(null);
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

  const vp = useViewportSize();
  const cardBackgroundColor = user?.card?.cover.backgroundColor ?? '#FFF';

  const blocks: Array<{
    key: number | string;
    blockContent: ReactElement;
    editPanel: ReactElement;
    sizeStyle: { width: number | string; height: number | string };
    measure(width: number): number;
  }> = [
    {
      key: 'cover',
      blockContent: (
        <CoverRenderer
          ref={coverRef}
          cover={user.card?.cover}
          userName={user.userName}
          width={vp`${VW100}`}
          imageIndex={imageIndex ?? initialRenderData?.initialImageIndex}
          forceImageIndex={isEditing}
          currentTime={initialRenderData?.initialVideoTime}
          isEditing={isEditing}
          isEditedBlock={editedBlock === 'cover'}
          playTransition={imageIndex === undefined && ready}
          videoPaused={!ready || imageIndex !== undefined}
          hideBorderRadius
          onReadyForDisplay={onCoverReadyForDisplay}
          style={hideCover ? { opacity: 0 } : { opacity: 1 }}
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
      sizeStyle: {
        width: vp`${VW100}`,
        height: vp`${VW100} / ${COVER_RATIO}`,
      },
      measure: width => width / COVER_RATIO,
    },
  ];

  return (
    <ModuleEditorContext.Provider value={moduleEditor}>
      <UserScreenLayout
        userName={user.userName}
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
