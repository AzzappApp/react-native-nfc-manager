/* eslint-disable @typescript-eslint/no-var-requires */

import type { Attributes, ComponentType } from 'react';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';

const unstable_createElement = require('react-native-web/dist/cjs/exports/createElement/');
/**
 * Create an HTML element with the given tag and props.
 * @see https://necolas.github.io/react-native-web/docs/unstable-apis/#use-with-existing-react-dom-components
 *
 * @param tag the tag name or component type to create, e.g. 'div' or React web component
 * @param props the props to pass to the element
 * @returns the created element
 */
function createHTMLElement<
  T extends ComponentType<any> | keyof JSX.IntrinsicElements,
  P extends T extends ComponentType<infer U>
    ? U
    : T extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[T]
    : never,
>(
  tag: T,
  props: Omit<Attributes & P, 'style'> & {
    style: StyleProp<ImageStyle | ViewStyle>;
  },
): React.ReactElement {
  return unstable_createElement(tag, props);
}

export default createHTMLElement;
