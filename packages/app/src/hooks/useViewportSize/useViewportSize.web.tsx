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
  return (strings: TemplateStringsArray, ...values: Values[]) => {
    const cssValue = strings.reduce((result, str, index) => {
      const operator = str.trim();
      const value = values[index];
      let strValue = '';
      if (typeof value === 'string' && (value as string).startsWith('calc')) {
        strValue = (value as string).slice(4);
      } else {
        switch (value) {
          case VH100:
            strValue = '100vh';
            break;
          case VW100:
            strValue = '100vw';
            break;
          case insetLeft:
            strValue = 'env(safe-area-inset-left, 0px)';
            break;
          case insetRight:
            strValue = 'env(safe-area-inset-right, 0px)';
            break;
          case insetBottom:
            strValue = 'env(safe-area-inset-bottom, 0px)';
            break;
          case insetTop:
            strValue = 'env(safe-area-inset-top, 0px)';
            break;
          default:
            if (value != null) {
              if (typeof value === 'number') {
                strValue =
                  operator === '-' || operator === '+'
                    ? `${value}px`
                    : `${value}`;
              } else {
                strValue = value + '';
              }
            }
            break;
        }
      }

      if (operator === '') {
        result += strValue;
      } else {
        result = `${result} ${operator} ${strValue}`;
      }
      return result;
    }, '');

    return strings.some(string => string.trim() !== '')
      ? `calc(${cssValue})`
      : cssValue;
  };
};

export default useViewportSize;
