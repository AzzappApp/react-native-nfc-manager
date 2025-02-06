import { useWindowDimensions } from 'react-native';

export const TRANSITIONS_DURATION = 350;

export const BUTTON_SIZE = 35;

export const EDIT_BLOCK_GAP = 20;

export const useWebCardEditScale = () => {
  const { width } = useWindowDimensions();

  // 2 buttons + 4 margins
  return (width - (BUTTON_SIZE * 2 + 20 * 4)) / width;
};
