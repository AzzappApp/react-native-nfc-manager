import pick from 'lodash/pick';
import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  DEFAULT_COLOR_LIST,
  DEFAULT_COLOR_PALETTE,
} from '@azzapp/shared/cardHelpers';
import { ColorDropDownPicker } from '#ui/ColorDropDownPicker';
import ColorPicker from '#ui/ColorPicker/ColorPicker';
import type { WebCardColorPicker_webCard$key } from '#relayArtifacts/WebCardColorPicker_webCard.graphql';
import type {
  WebCardColorPickerMutation,
  CardColorsInput,
} from '#relayArtifacts/WebCardColorPickerMutation.graphql';
import type { ColorDropDownPickerProps } from '#ui/ColorDropDownPicker';
import type { ColorPickerProps } from '#ui/ColorPicker';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';

export type WebCardColorsBoundsComponentProps<T> = Omit<
  T,
  'colorList' | 'colorPalette' | 'onUpdateColorList' | 'onUpdateColorPalette'
> & {
  /**
   * webCard of the current user.
   * Used to access the user's webCard color palette.
   */
  webCard: WebCardColorPicker_webCard$key | null;
};

export type WebCardColorPickerProps =
  WebCardColorsBoundsComponentProps<ColorPickerProps>;

/**
 * A component displaying a color picker based on the user's color palette.
 * @see ColorPicker
 */
const WebCardColorPicker = ({ webCard, ...props }: WebCardColorPickerProps) => {
  const webCardColorsProps = useWebCardColors(webCard);
  return <ColorPicker {...webCardColorsProps} {...props} />;
};

export default WebCardColorPicker;

export type WebCardColorDropDownPickerProps =
  WebCardColorsBoundsComponentProps<ColorDropDownPickerProps>;

/**
 * A component displaying a color drop down picker based on the user's color palette.
 * @see ColorDropDownPicker
 */
export const WebCardColorDropDownPicker = ({
  webCard,
  ...props
}: WebCardColorDropDownPickerProps) => {
  const webCardColorsProps = useWebCardColors(webCard);
  return <ColorDropDownPicker {...webCardColorsProps} {...props} />;
};

export const useWebCardColorsFragment = (
  webCardKey: WebCardColorPicker_webCard$key | null,
) => {
  const webCard = useFragment(
    graphql`
      fragment WebCardColorPicker_webCard on WebCard {
        id
        cardColors {
          primary
          light
          dark
          otherColors
        }
      }
    `,
    webCardKey,
  );

  const mutation = useMutation<WebCardColorPickerMutation>(graphql`
    mutation WebCardColorPickerMutation(
      $webCardId: ID!
      $input: CardColorsInput!
    ) {
      saveCardColors(webCardId: $webCardId, input: $input) {
        webCard {
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

  return {
    webCard,
    mutation,
  };
};

/**
 * A hook to access the user's color palette.
 * Used to share the logic between ProfileColorPicker and ProfileColorDropDownPicker.
 */
export const useWebCardColors = (
  webCardKey: WebCardColorPicker_webCard$key | null,
) => {
  const {
    webCard,
    mutation: [commit],
  } = useWebCardColorsFragment(webCardKey);

  const intl = useIntl();

  const updateCardColors = useCallback(
    (updates: Partial<CardColorsInput>) => {
      const webCardId = webCard?.id;
      if (!webCardId) {
        return;
      }
      const input = {
        ...DEFAULT_COLOR_PALETTE,
        otherColors: DEFAULT_COLOR_LIST,
        ...webCard?.cardColors,
        ...updates,
      };
      commit({
        variables: {
          webCardId,
          input: {
            ...DEFAULT_COLOR_PALETTE,
            otherColors: DEFAULT_COLOR_LIST,
            ...webCard?.cardColors,
            ...updates,
          },
        },
        optimisticResponse: {
          saveCardColors: {
            webCard: {
              id: webCard?.id,
              cardColors: input,
            },
          },
        },
        onError: () => {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage:
                'Error while updating your colors, please try again.',
              description: 'Error toast message when updating colors fails.',
            }),
          });
        },
      });
    },
    [commit, intl, webCard?.cardColors, webCard?.id],
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
      webCard?.cardColors
        ? pick(webCard.cardColors, ['primary', 'light', 'dark'])
        : DEFAULT_COLOR_PALETTE,
    [webCard?.cardColors],
  );

  const colorList = useMemo(
    () =>
      webCard?.cardColors?.otherColors?.slice() ?? DEFAULT_COLOR_LIST.slice(),
    [webCard?.cardColors],
  );

  return {
    colorPalette,
    colorList,
    onUpdateColorList,
    onUpdateColorPalette,
  };
};
