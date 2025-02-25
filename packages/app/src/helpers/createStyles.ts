import merge from 'lodash/merge';
import { useColorScheme, StyleSheet } from 'react-native';
import type {
  ColorSchemeName,
  ImageStyle,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';

export type DefinedColorSchemeName = Exclude<ColorSchemeName, null | undefined>;

type ColorSchemeStyleSheet<T> = Record<DefinedColorSchemeName, T>;

type ComposableNamedStyles<T> = {
  [P in keyof T]: StyleProp<ImageStyle | TextStyle | ViewStyle>;
};

/**
 * It takes a function that returns a style object.
 * It returns a style sheet object that has a light and dark version of the style object
 * @param factory - (appearance: ColorSchemeName) => T
 * @returns An object container a light and dark version of the style object
 */
export const createStyleSheet = <T extends ComposableNamedStyles<T>>(
  factory: (appearance: DefinedColorSchemeName) => T,
): ColorSchemeStyleSheet<T> => {
  return {
    light: StyleSheet.create(composeStyles(factory('light')) as any),
    dark: StyleSheet.create(composeStyles(factory('dark')) as any),
  };
};

/**
 * Use a style sheet object that has a light and dark version of the style object
 * and select the correct one based on the current color scheme
 *
 * @template T
 * @param {ColorSchemeStyleSheet<T>} styleSheet
 * @param {ColorSchemeName} [appearance] - The color scheme to use over the system one
 * @returns a react native style object
 */
export const useStyleSheet = <T>(
  styleSheet: ColorSchemeStyleSheet<T>,
  appearance?: ColorSchemeName,
) => {
  const colorScheme = useColorScheme();
  return styleSheet[appearance ?? colorScheme ?? 'light'];
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
    const value = styles[key as keyof T];
    result[key as keyof T] = Array.isArray(value)
      ? StyleSheet.flatten(styles[key as keyof T] as any)
      : (value ?? {});
  });
  return result as any;
};

/**
 * Use a style sheet object that has multiple variants and a light and dark version of the style object
 * and select the correct one based on the current color scheme and the given variant
 *
 * @param styleSheet - A style sheet object that has multiple variants and a light and dark version of the style object
 * @param variant - The variant to use
 * @param {ColorSchemeName} [appearance] - The color scheme to use over the system one
 * @returns a react native style object
 *
 */
export const useVariantStyleSheet = <Variants extends string, T>(
  styleSheet: VariantsStyleSheet<Variants, T>,
  variant: Variants,
  appearance?: ColorSchemeName | null,
): T => useStyleSheet(styleSheet[variant], appearance);

type ValueOf<T> = T[keyof T];

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;
