import { StyleSheet } from 'react-native';
import { textStyles } from '#theme';

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
});
