import { graphql, useFragment, useMutation } from 'react-relay';
import { ColorDropDownPicker } from '#ui/ColorDropDownPicker';
import ColorPicker from '#ui/ColorPicker/ColorPicker';
import type { ColorDropDownPickerProps } from '#ui/ColorDropDownPicker';
import type { ColorPickerProps } from '#ui/ColorPicker';
import type { ProfileColorPicker_profile$key } from '@azzapp/relay/artifacts/ProfileColorPicker_profile.graphql';
import type { ProfileColorPickerMutation } from '@azzapp/relay/artifacts/ProfileColorPickerMutation.graphql';

export type ProfileColorPickerProps = Omit<
  ColorPickerProps,
  'colorList' | 'onUpdateColorList'
> & {
  /**
   * Profile of the current user.
   * Used to access the user's profile color palette.
   */
  profile: ProfileColorPicker_profile$key;
};

/**
 * A component displaying a color picker based on the user's color palette.
 * @see ColorPicker
 */
const ProfileColorPicker = ({ profile, ...props }: ProfileColorPickerProps) => {
  const { colorList, onUpdateColorList } = useProfileColorPalette(profile);
  return (
    <ColorPicker
      onUpdateColorList={onUpdateColorList}
      colorList={colorList}
      {...props}
    />
  );
};

export default ProfileColorPicker;

export type ProfileColorDropDownPickerProps = Omit<
  ColorDropDownPickerProps,
  'colorList' | 'onUpdateColorList'
> & {
  /**
   * Profile of the current user.
   * Used to access the user's profile color palette.
   */
  profile: ProfileColorPicker_profile$key;
};

/**
 * A component displaying a color drop down picker based on the user's color palette.
 * @see ColorDropDownPicker
 */
export const ProfileColorDropDownPicker = ({
  profile,
  ...props
}: ProfileColorDropDownPickerProps) => {
  const { colorList, onUpdateColorList } = useProfileColorPalette(profile);
  return (
    <ColorDropDownPicker
      onUpdateColorList={onUpdateColorList}
      colorList={colorList}
      {...props}
    />
  );
};

/**
 * A hook to access the user's color palette.
 * Used to share the logic between ProfileColorPicker and ProfileColorDropDownPicker.
 */
const useProfileColorPalette = (profileKey: ProfileColorPicker_profile$key) => {
  const profile = useFragment(
    graphql`
      fragment ProfileColorPicker_profile on Profile {
        id
        colorPalette
      }
    `,
    profileKey,
  );

  const [commit] = useMutation<ProfileColorPickerMutation>(graphql`
    mutation ProfileColorPickerMutation($input: UpdateProfileInput!) {
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
      // TODO add error handling
    });
  };

  return {
    colorList: profile.colorPalette,
    onUpdateColorList: onUpdatePalette,
  };
};
