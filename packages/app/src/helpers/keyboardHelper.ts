import { Keyboard } from 'react-native';

// Keyboard dismiss helper close keyboard only if it is open
// notice on ios Keyboard.dismiss close also the paste menu,
// Using this helper avoid this behavior
export const keyboardDismiss = () => {
  if (Keyboard.isVisible()) {
    Keyboard.dismiss();
  }
};
