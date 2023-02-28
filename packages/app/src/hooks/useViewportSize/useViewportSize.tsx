import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  VH100,
  VW100,
  insetLeft,
  insetBottom,
  insetRight,
  insetTop,
} from './helpers';
import type { Values } from './helpers';

const useViewportSize = () => {
  const { width, height } = useWindowDimensions();

  const insets = useSafeAreaInsets();

  return (strings: TemplateStringsArray, ...values: Values[]) =>
    strings.reduce((result, str, index) => {
      const operator = str.trim();
      let value = values[index];

      switch (value) {
        case VH100:
          value = height;
          break;
        case VW100:
          value = width;
          break;
        case insetLeft:
          value = insets.left;
          break;
        case insetRight:
          value = insets.right;
          break;
        case insetBottom:
          value = insets.bottom;
          break;
        case insetTop:
          value = insets.top;
          break;
        default:
          break;
      }
      if (isNaN(result)) {
        return value;
      }
      switch (operator) {
        case '+':
          result += value;
          break;
        case '-':
          result -= value;
          break;
        case '*':
          result *= value;
          break;
        case '/':
          result /= value;
          break;
        default:
          break;
      }
      return result;
    }, NaN);
};

export default useViewportSize;
