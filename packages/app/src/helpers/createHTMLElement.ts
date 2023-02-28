/* eslint-disable @typescript-eslint/no-var-requires */

import type { Attributes, ComponentType } from 'react';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';

const unstable_createElement = require('react-native-web/dist/cjs/exports/createElement/');

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
