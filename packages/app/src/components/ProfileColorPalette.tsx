import { graphql, useFragment, useMutation } from 'react-relay';
import ColorPicker from '#ui/ColorPicker/ColorPicker';
import type { ColorPickerProps } from '#ui/ColorPicker';
import type { ProfileColorPalette_profile$key } from '@azzapp/relay/artifacts/ProfileColorPalette_profile.graphql';
import type { ProfileColorPaletteMutation } from '@azzapp/relay/artifacts/ProfileColorPaletteMutation.graphql';

export type ProfileColorPaletteProps = Omit<
  ColorPickerProps,
  'colorList' | 'onUpdateColorList'
> & {
  profile: ProfileColorPalette_profile$key;
};

const ProfileColorPalette = (props: ProfileColorPaletteProps) => {
  const profile = useFragment(
    graphql`
      fragment ProfileColorPalette_profile on Profile {
        id
        colorPalette
      }
    `,
    props.profile,
  );

  const [commit] = useMutation<ProfileColorPaletteMutation>(graphql`
    mutation ProfileColorPaletteMutation($input: UpdateProfileInput!) {
      updateProfile(input: $input) {
        profile {
          id
          colorPalette
        }
      }
    }
  `);

  const onUpdatePalette = (colorPalette: string[]) => {
    commit({
      variables: {
        input: {
          colorPalette,
        },
      },
      optimisticResponse: {
        updateProfile: {
          profile: {
            id: profile.id,
            colorPalette,
          },
        },
      },
    });
  };

  return (
    <ColorPicker
      onUpdateColorList={onUpdatePalette}
      colorList={profile.colorPalette}
      {...props}
    />
  );
};

export default ProfileColorPalette;
