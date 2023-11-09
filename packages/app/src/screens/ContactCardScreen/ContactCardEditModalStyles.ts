import { textStyles } from '#theme';
import { createStyleSheet } from '#helpers/createStyles';
import type { ColorSchemeName } from 'react-native';

export const DELETE_BUTTON_WIDTH = 60;

const FIELD_HEIGHT = 72;

export const buildContactCardModalStyleSheet = (appareance: ColorSchemeName) =>
  ({
    field: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: FIELD_HEIGHT,
      paddingHorizontal: 20,
      backgroundColor: appareance === 'light' ? 'white' : 'black',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 7,
      height: FIELD_HEIGHT,
      paddingHorizontal: 20,
      backgroundColor: appareance === 'light' ? 'white' : 'black',
    },
    input: {
      flex: 1,
      padding: 0,
      backgroundColor: 'transparent',
      borderWidth: 0,
      paddingLeft: 0,
      paddingRight: 0,
      textAlign: 'right',
      ...textStyles.medium,
    },
  }) as const;

export const contactCardEditModalStyleSheet = createStyleSheet(
  buildContactCardModalStyleSheet,
);
