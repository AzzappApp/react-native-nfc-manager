import { StyleSheet } from 'react-native';
import { colors, textStyles } from '#theme';

export const DELETE_BUTTON_WIDTH = 60;

export default StyleSheet.create({
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 7,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    textAlign: 'right',
    ...textStyles.medium,
  },
});
