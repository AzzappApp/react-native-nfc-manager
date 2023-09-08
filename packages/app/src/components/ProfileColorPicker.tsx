import { pick } from 'lodash';
import { useCallback, useMemo } from 'react';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  DEFAULT_COLOR_LIST,
  DEFAULT_COLOR_PALETTE,
} from '@azzapp/shared/cardHelpers';
import { ColorDropDownPicker } from '#ui/ColorDropDownPicker';
import ColorPicker from '#ui/ColorPicker/ColorPicker';
import type { ColorDropDownPickerProps } from '#ui/ColorDropDownPicker';
import type { ColorPickerProps } from '#ui/ColorPicker';
import type { ProfileColorPicker_profile$key } from '@azzapp/relay/artifacts/ProfileColorPicker_profile.graphql';
import type {
  ProfileColorPickerMutation,
  SaveCardColorsInput,
} from '@azzapp/relay/artifacts/ProfileColorPickerMutation.graphql';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';

export type ProfileColorsBoundsComponentProps<T> = Omit<
  T,
  'colorList' | 'colorPalette' | 'onUpdateColorList' | 'onUpdateColorPalette'
> & {
  /**
   * Profile of the current user.
   * Used to access the user's profile color palette.
   */
  profile: ProfileColorPicker_profile$key;
};

export type ProfileColorPickerProps =
  ProfileColorsBoundsComponentProps<ColorPickerProps>;

/**
 * A component displaying a color picker based on the user's color palette.
 * @see ColorPicker
 */
const ProfileColorPicker = ({ profile, ...props }: ProfileColorPickerProps) => {
  const profileColorsProps = useProfileCardColors(profile);
  return <ColorPicker {...profileColorsProps} {...props} />;
};

export default ProfileColorPicker;

export type ProfileColorDropDownPickerProps =
  ProfileColorsBoundsComponentProps<ColorDropDownPickerProps>;

/**
 * A component displaying a color drop down picker based on the user's color palette.
 * @see ColorDropDownPicker
 */
export const ProfileColorDropDownPicker = ({
  profile,
  ...props
}: ProfileColorDropDownPickerProps) => {
  const profileColorsProps = useProfileCardColors(profile);
  return <ColorDropDownPicker {...profileColorsProps} {...props} />;
};

/**
 * A hook to access the user's color palette.
 * Used to share the logic between ProfileColorPicker and ProfileColorDropDownPicker.
 */
export const useProfileCardColors = (
  profileKey: ProfileColorPicker_profile$key,
) => {
  const profile = useFragment(
    graphql`
      fragment ProfileColorPicker_profile on Profile {
        id
        cardColors {
          primary
          light
          dark
          otherColors
        }
      }
    `,
    profileKey,
  );

  const [commit] = useMutation<ProfileColorPickerMutation>(graphql`
    mutation ProfileColorPickerMutation($input: SaveCardColorsInput!) {
      saveCardColors(input: $input) {
        profile {
          id
          cardColors {
            primary
            light
            dark
            otherColors
          }
        }
      }
    }
  `);

  const updateCardColors = useCallback(
    (updates: Partial<SaveCardColorsInput>) => {
      const input = {
        ...DEFAULT_COLOR_PALETTE,
        otherColors: DEFAULT_COLOR_LIST,
        ...profile.cardColors,
        ...updates,
      };
      commit({
        variables: {
          input: {
            ...DEFAULT_COLOR_PALETTE,
            otherColors: DEFAULT_COLOR_LIST,
            ...profile.cardColors,
            ...updates,
          },
        },
        optimisticResponse: {
          saveCardColors: {
            profile: {
              id: profile.id,
              cardColors: input,
            },
          },
        },
        // TODO add error handling
      });
    },
    [commit, profile.cardColors, profile.id],
  );

  const onUpdateColorList = useCallback(
    (colorList: string[]) => {
      updateCardColors({ otherColors: colorList });
    },
    [updateCardColors],
  );

  const onUpdateColorPalette = useCallback(
    (colorPalette: ColorPalette) => {
      updateCardColors(colorPalette);
    },
    [updateCardColors],
  );

  const colorPalette = useMemo(
    () =>
      profile.cardColors
        ? pick(profile.cardColors, ['primary', 'light', 'dark'])
        : DEFAULT_COLOR_PALETTE,
    [profile.cardColors],
  );

  const colorList = useMemo(
    () =>
      profile.cardColors?.otherColors?.slice() ?? DEFAULT_COLOR_LIST.slice(),
    [profile.cardColors],
  );

  return {
    colorPalette,
    colorList,
    onUpdateColorList,
    onUpdateColorPalette,
  };
};
