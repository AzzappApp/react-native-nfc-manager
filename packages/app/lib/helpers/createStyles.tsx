import merge from 'lodash/merge';
import { useColorScheme, StyleSheet } from 'react-native';
import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native';

export type ColorSchemeName = 'dark' | 'light';

type ColorSchemeStyleSheet<T> = Record<ColorSchemeName, T>;

type ComposableStyle<T> = Array<StyleProp<T>> | StyleProp<T>;

type ComposableNamedStyles<T> = {
  [P in keyof T]: ComposableStyle<ImageStyle | TextStyle | ViewStyle>;
};

/**
 * It takes a function that returns a style object.
 * It returns a style sheet object that has a light and dark version of the style object
 * @param factory - (appeareance: ColorSchemeName) => T
 * @returns An object container a light and dark version of the style object
 */
export const createStyleSheet = <T extends ComposableNamedStyles<T>>(
  factory: (appeareance: ColorSchemeName) => T,
): ColorSchemeStyleSheet<T> => {
  return {
    light: StyleSheet.create(factory('light') as any),
    dark: StyleSheet.create(factory('dark') as any),
  };
};

export const useStyleSheet = <T,>(styleSheet: ColorSchemeStyleSheet<T>) => {
  const colorScheme = useColorScheme() ?? 'light';

  return styleSheet[colorScheme];
};

type VariantsStyleSheet<Variants extends keyof any, T> = Record<
  Variants,
  ColorSchemeStyleSheet<T>
>;

const DEFAULT_VARIANT = 'default';

/**
 * It takes a function that returns a set of styles for each variant. The `default` variant name is reserved
 * and used as common styles for all other variant. It will be deep merged with each variant styles.
 * Variant style will have precedence over the default style.
 * @param factory - (appeareance: ColorSchemeName) => T
 * @returns Return an object will all combination between variants and ('light'|'dark') color scheme
 */
export function createVariantsStyleSheet<
  T extends Record<
    Variants,
    ComposableNamedStyles<any> | ComposableNamedStyles<T>
  >,
  Variants extends keyof T,
>(
  factory: (appeareance: ColorSchemeName) => T,
): VariantsStyleSheet<Variants, UnionToIntersection<ValueOf<T>>> {
  const result = {} as any;
  const lightStyles = factory('light');
  const darkStyles = factory('dark');

  const keys = Object.keys(lightStyles).filter(v => v !== DEFAULT_VARIANT);
  const commonLight = composeStyles(lightStyles[DEFAULT_VARIANT as Variants]);
  const commonDark = composeStyles(darkStyles[DEFAULT_VARIANT as Variants]);

  keys.forEach(variantKey => {
    result[variantKey] = {
      light: StyleSheet.create(
        merge(
          {},
          commonLight,
          composeStyles(lightStyles[variantKey as Variants]),
        ),
      ),
      dark: StyleSheet.create(
        merge(
          {},
          commonDark,
          composeStyles(darkStyles[variantKey as Variants]),
        ),
      ),
    };
  });

  return result;
}

const composeStyles = <T extends ComposableNamedStyles<T>>(
  styles: T,
): StyleSheet.NamedStyles<T> => {
  const result: T = {} as any;
  Object.keys(styles).forEach(key => {
    let value = styles[key as keyof T];
    if (Array.isArray(value)) {
      value = Object.assign({}, ...(styles[key as keyof T] as any));
    } else if (!value) {
      value = {} as any;
    }
    result[key as keyof T] = value;
  });

  return result as any;
};

export const useVariantStyleSheet = <Variants extends string, T>(
  styleSheet: VariantsStyleSheet<Variants, T>,
  variant: Variants,
): T => {
  return useStyleSheet(styleSheet[variant]);
};

type ValueOf<T> = T[keyof T];

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;
