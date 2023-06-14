import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { View, useWindowDimensions } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { CARD_DEFAULT_BACKGROUND_COLOR } from '@azzapp/shared/cardHelpers';
import { MODULE_KINDS } from '@azzapp/shared/cardModuleHelpers';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import ProfileColorPicker from '#components/ProfileColorPicker';
import ModuleSelectionListModal from './ModuleSelectionListModal';
import ProfileBlockContainer from './ProfileBlockContainer';
import ProfileScreenBody from './ProfileScreenBody';
import ProfileScreenFooter from './ProfileScreenFooter';
import ProfileScreenHeader from './ProfileScreenHeader';
import ProfileScreenScrollView from './ProfileScreenScrollView';
import type {
  ProfileBodyHandle,
  ModuleSelectionInfos,
} from './ProfileScreenBody';
import type { ProfileScreenContent_profile$key } from '@azzapp/relay/artifacts/ProfileScreenContent_profile.graphql';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';

type ProfileScreenProps = {
  profile: ProfileScreenContent_profile$key;
  ready?: boolean;
  editMode?: boolean;
  toggleEditMode: () => void;
};

/**
 * This component is the main component of the Profile screen.
 * render the content of the screen.
 */
const ProfileScreenContent = ({
  profile: profileKey,
  ready = true,
  editMode = false,
  toggleEditMode,
}: ProfileScreenProps) => {
  // #region Data
  const profile = useFragment(
    graphql`
      fragment ProfileScreenContent_profile on Profile {
        id
        userName
        card {
          id
          backgroundColor
          cover {
            ...CoverRenderer_cover
          }
          ...ProfileScreenBody_card
        }
        ...ProfileColorPicker_profile
      }
    `,
    profileKey,
  );
  // #endregion

  // #region Navigation
  const router = useRouter();

  const onClose = useCallback(() => {
    router.back();
  }, [router]);
  // #endregion

  // #region Edition state

  const [editingDisplayMode, setEditingDisplayMode] = useState<
    'desktop' | 'mobile'
  >('mobile');

  const onDone = useCallback(() => {
    toggleEditMode();
    setEditingDisplayMode('mobile');
  }, [toggleEditMode]);

  // #endregion

  // #region Color picker
  const [backgroundColor, setBackgroundColor] = useState(
    profile.card?.backgroundColor ?? CARD_DEFAULT_BACKGROUND_COLOR,
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const onRequestColorPicker = useCallback(() => {
    setShowColorPicker(true);
  }, []);

  const onCloseColorPicker = useCallback(() => {
    setShowColorPicker(false);
  }, []);

  const [commitBackground] = useMutation(graphql`
    mutation ProfileScreenContentUpdateCardMutation($input: UpdateCardInput!) {
      updateCard(input: $input) {
        card {
          id
          backgroundColor
        }
      }
    }
  `);

  const firstTime = useRef(true);
  const [debouncedBackgroundColor] = useDebounce(backgroundColor, 300);
  useEffect(() => {
    if (firstTime.current) {
      firstTime.current = false;
      return;
    }
    commitBackground({
      variables: {
        input: {
          backgroundColor: debouncedBackgroundColor,
        },
      },
    });
  }, [commitBackground, debouncedBackgroundColor]);
  // #endregion

  // #region New Module
  const [showModulePicker, setShowModulePicker] = useState(false);
  const onRequestNewModule = useCallback(() => {
    setShowModulePicker(true);
  }, []);

  const onCloseModulePicker = useCallback(() => {
    setShowModulePicker(false);
  }, []);

  const onSelectModuleKind = useCallback(
    (module: ModuleKind) => {
      setShowModulePicker(false);
      router.push({
        route: 'CARD_MODULE_EDITION',
        params: { module, isNew: true },
      });
    },
    [router],
  );
  // #endregion

  // #region Module edition
  const onEditModule = useCallback(
    (module: ModuleKind, moduleId: string) => {
      if (!MODULE_KINDS.includes(module)) {
        // unhanded module kind could be a future addition
        return;
      }
      router.push({
        route: 'CARD_MODULE_EDITION',
        params: {
          module,
          moduleId,
        },
      });
    },
    [router],
  );

  const onEditCover = useCallback(() => {
    router.push({
      route: 'CARD_MODULE_EDITION',
      params: {
        module: 'cover',
      },
    });
  }, [router]);

  const [selectionMode, setSelectionMode] = useState(false);
  const [
    {
      nbSelectedModules,
      selectionContainsHiddenModules,
      selectionContainsAllModules,
    },
    setSelectionInfos,
  ] = useState<ModuleSelectionInfos>({
    nbSelectedModules: 0,
    selectionContainsHiddenModules: false,
    selectionContainsAllModules: false,
  });

  const onEnableSelectionMode = useCallback(() => {
    setSelectionMode(true);
  }, []);

  const onCancelSelectionMode = useCallback(() => {
    setSelectionMode(false);
  }, []);

  const onSelectionStateChange = useCallback((info: ModuleSelectionInfos) => {
    setSelectionInfos(info);
  }, []);

  const profileBodyRef = useRef<ProfileBodyHandle>(null);

  const onSelectAllModules = useCallback(() => {
    profileBodyRef.current?.selectAllModules();
  }, []);

  const onUnSelectAllModules = useCallback(() => {
    profileBodyRef.current?.unselectAllModules();
  }, []);

  const onDeleteSelectedModules = useCallback(() => {
    profileBodyRef.current?.deleteSelectedModules();
    setSelectionMode(false);
  }, []);

  const onToggleSelectedModulesVisibility = useCallback((visible: boolean) => {
    profileBodyRef.current?.toggleSelectedModulesVisibility(visible);
    setSelectionMode(false);
  }, []);
  // #endregion

  // #endregion

  const intl = useIntl();
  const { width: windowSize } = useWindowDimensions();

  return (
    <>
      <View style={{ flex: 1, backgroundColor }}>
        <ProfileScreenHeader
          editing={editMode}
          ready={ready}
          nbSelectedModules={nbSelectedModules}
          selectionMode={selectionMode}
          selectionContainsAllModules={selectionContainsAllModules}
          onDone={onDone}
          onClose={onClose}
          onEditModules={onEnableSelectionMode}
          onCancelEditModules={onCancelSelectionMode}
          onSelectAllModules={onSelectAllModules}
          onUnSelectAllModules={onUnSelectAllModules}
        />
        <ProfileScreenScrollView editing={editMode} ready={ready}>
          <ProfileBlockContainer
            backgroundColor={backgroundColor}
            editing={editMode}
            displayEditionButtons={false}
            onModulePress={onEditCover}
          >
            <CoverRenderer
              cover={profile.card?.cover}
              userName={profile.userName}
              width={windowSize}
              videoEnabled={ready}
              hideBorderRadius
            />
          </ProfileBlockContainer>
          <Suspense fallback={null}>
            {profile.card && (
              <ProfileScreenBody
                ref={profileBodyRef}
                card={profile.card}
                editing={editMode}
                selectionMode={selectionMode}
                backgroundColor={backgroundColor}
                onEditModule={onEditModule}
                onSelectionStateChange={onSelectionStateChange}
              />
            )}
          </Suspense>
        </ProfileScreenScrollView>
        <ProfileScreenFooter
          editing={editMode}
          ready={ready}
          currentEditionView={editingDisplayMode}
          selectionMode={selectionMode}
          hasSelectedModules={nbSelectedModules > 0}
          selectionContainsHiddenModules={selectionContainsHiddenModules}
          backgroundColor={backgroundColor}
          onEditingDisplayModeChange={setEditingDisplayMode}
          onRequestNewModule={onRequestNewModule}
          onRequestColorPicker={onRequestColorPicker}
          onDelete={onDeleteSelectedModules}
          onToggleVisibility={onToggleSelectedModulesVisibility}
        />
      </View>
      <ModuleSelectionListModal
        visible={showModulePicker}
        onRequestClose={onCloseModulePicker}
        onSelectModuleKind={onSelectModuleKind}
        animationType="slide"
      />
      <Suspense>
        <ProfileColorPicker
          title={intl.formatMessage({
            defaultMessage: 'Web card color',
            description: 'Profile screen color picker title',
          })}
          profile={profile}
          visible={showColorPicker}
          selectedColor={
            profile.card?.backgroundColor ?? CARD_DEFAULT_BACKGROUND_COLOR
          }
          height={350}
          onColorChange={setBackgroundColor}
          onRequestClose={onCloseColorPicker}
        />
      </Suspense>
    </>
  );
};

export default ProfileScreenContent;
