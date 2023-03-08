import { Suspense } from 'react';
import {
  graphql,
  useFragment,
  useLazyLoadQuery,
  useMutation,
} from 'react-relay';

import ColorPicker from '#ui/ColorPicker/ColorPicker';
import type { ColorPickerProps } from '#ui/ColorPicker/ColorPicker';
import type { ProfileColorPalette_color$key } from '@azzapp/relay/artifacts/ProfileColorPalette_color.graphql';
import type { ProfileColorPaletteMutation } from '@azzapp/relay/artifacts/ProfileColorPaletteMutation.graphql';
import type { ProfileColorPaletteQuery } from '@azzapp/relay/artifacts/ProfileColorPaletteQuery.graphql';

export type ProfileColorPaletteProps = Omit<
  ColorPickerProps,
  'addColor' | 'colorList' | 'deleteColor'
>;

const ProfileColorPaletteWrapper = (props: ProfileColorPaletteProps) => {
  const { viewer } = useLazyLoadQuery<ProfileColorPaletteQuery>(
    graphql`
      query ProfileColorPaletteQuery {
        viewer {
          profile {
            ...ProfileColorPalette_color
          }
        }
      }
    `,
    {},
  );

  return (
    <Suspense>
      {viewer?.profile ? (
        <ProfileColorPalette {...props} profileKey={viewer?.profile} />
      ) : null}
    </Suspense>
  );
};

export default ProfileColorPaletteWrapper;

const ProfileColorPalette = (
  props: ProfileColorPaletteProps & {
    profileKey: ProfileColorPalette_color$key;
  },
) => {
  const profile = useFragment(
    graphql`
      fragment ProfileColorPalette_color on Profile {
        id
        colorPalette
      }
    `,
    props.profileKey,
  );

  const [commit] = useMutation<ProfileColorPaletteMutation>(graphql`
    mutation ProfileColorPaletteMutation($input: UpdateProfileInput!) {
      updateProfile(input: $input) {
        profile {
          ...ProfileColorPalette_color
        }
      }
    }
  `);

  const addColor = (color: string) => {
    const newColorArray = [...(profile.colorPalette ?? []), color];
    commit({
      variables: {
        input: {
          colorPalette: newColorArray.join(','),
        },
      },
      optimisticResponse: {
        updateProfile: {
          profile: {
            id: profile.id,
            colorPalette: newColorArray,
          },
        },
      },
    });
  };

  const deleteColor = (color: string) => {
    if (profile.colorPalette && profile.colorPalette.length >= 0) {
      const newColorArray = profile.colorPalette.filter(c => c !== color);

      commit({
        variables: {
          input: {
            colorPalette: newColorArray.join(','),
          },
        },
        optimisticResponse: {
          updateProfile: {
            profile: {
              id: profile.id,
              colorPalette: newColorArray,
            },
          },
        },
      });
    }
  };

  return (
    <ColorPicker
      {...props}
      colorList={profile.colorPalette}
      addColor={addColor}
      deleteColor={deleteColor}
    />
  );
};
