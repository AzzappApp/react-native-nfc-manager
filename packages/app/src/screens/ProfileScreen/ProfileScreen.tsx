import { useState } from 'react';
import { Platform } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { useRouter } from '#PlatformEnvironment';
import CoverRenderer from '#components/CoverRenderer';
import useViewportSize, { VW100 } from '#hooks/useViewportSize';
import ProfileScreenLayout from './ProfileScreenLayout';
import type { NativeRouter } from '#components/NativeRouter';
import type { ProfileScreen_profile$key } from '@azzapp/relay/artifacts/ProfileScreen_profile.graphql';
import type { ProfileScreenToggleFollowMutation } from '@azzapp/relay/artifacts/ProfileScreenToggleFollowMutation.graphql';

type ProfileScreenProps = {
  profile: ProfileScreen_profile$key;
  ready?: boolean;
};

const ProfileScreen = ({
  profile: profileKey,
  ready = true,
}: ProfileScreenProps) => {
  const profile = useFragment(
    graphql`
      fragment ProfileScreen_profile on Profile {
        id
        userName
        card {
          id
          cover {
            ...CoverRenderer_cover
          }
        }
      }
    `,
    profileKey,
  );

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canSave] = useState(false);

  const [commit, toggleFollowingActive] =
    useMutation<ProfileScreenToggleFollowMutation>(graphql`
      mutation ProfileScreenToggleFollowMutation(
        $input: ToggleFollowingInput!
      ) {
        toggleFollowing(input: $input) {
          profile {
            id
            isFollowing
          }
        }
      }
    `);

  const onToggleFollow = (follow: boolean) => {
    // TODO do we really want to prevent fast clicking?
    if (toggleFollowingActive) {
      return;
    }
    commit({
      variables: {
        input: {
          profileId: profile.id,
          follow,
        },
      },
      optimisticResponse: {
        toggleFollowing: {
          profile: {
            id: profile.id,
            isFollowing: follow,
          },
        },
      },
      onError(error) {
        // TODO: handle error
        console.log(error);
      },
    });
  };

  const router = useRouter();
  const onHome = () => {
    if (Platform.OS === 'web') {
      router.push({ route: 'HOME' });
    } else {
      (router as NativeRouter).backToTop();
    }
  };

  const onClose = () => {
    router.back();
  };

  const onCancel = () => {
    setEditing(false);
  };

  const onEdit = () => {
    setEditing(true);
  };

  const onEditBlock = (module: number | string) => {
    router.push({
      route: 'CARD_MODULE_EDITION',
      // TODO not sure about how we will handle this
      params: { module: module as any },
    });
  };

  const onSave = () => {
    setSaving(true);
    // TODO
    setSaving(false);
  };

  const vp = useViewportSize();

  return (
    <ProfileScreenLayout
      ready={ready}
      editing={editing}
      saving={saving}
      canSave={canSave}
      userName={profile.userName}
      blocks={[
        {
          id: 'cover',
          children: (
            <CoverRenderer
              cover={profile.card?.cover}
              userName={profile.userName}
              width={vp`${VW100}`}
              videoEnabled={ready}
              hideBorderRadius
            />
          ),
        },
      ]}
      onCancel={onCancel}
      onSave={onSave}
      onHome={onHome}
      onEdit={onEdit}
      onEditBlock={onEditBlock}
      onToggleFollow={onToggleFollow}
      onClose={onClose}
    />
  );
};

export default ProfileScreen;
