import { forwardRef } from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme';
import MediaImageRenderer from './MediaImageRenderer';
import MediaVideoRenderer from './MediaVideoRenderer';
import type { MediaInnerRendererProps, MediaRendererOptions } from './types';
import type { ComponentType, ForwardedRef } from 'react';
import type { StyleProp, HostComponent, ImageStyle } from 'react-native';

type MediaRendererProps = MediaRendererOptions & {
  kind: '%future added value' | 'picture' | 'video';
  source: string;
  width: number | `${number}vw`;
  aspectRatio: number;
  uri?: string;
  style?: StyleProp<ImageStyle>;
  nativeID?: string;
  testID?: string;
};

const MediaRenderer = (
  {
    kind,
    source,
    aspectRatio,
    uri,
    width,
    style,
    ...options
  }: MediaRendererProps,
  ref: ForwardedRef<HostComponent<any>>,
) => {
  let Renderer: ComponentType<MediaInnerRendererProps> | null;
  switch (kind) {
    case 'picture':
      Renderer = MediaImageRenderer;
      break;
    case 'video':
      Renderer = MediaVideoRenderer;
      break;
    default:
      Renderer = null;
      break;
  }
  const sizeStyles = { width, aspectRatio };
  if (!Renderer) {
    return (
      <View
        style={{
          ...sizeStyles,
          backgroundColor: colors.lightGrey,
        }}
      />
    );
  }
  return (
    <Renderer
      mediaRef={ref}
      source={source}
      uri={uri}
      width={width}
      aspectRatio={aspectRatio}
      style={[sizeStyles, style]}
      {...options}
    />
  );
};

export default forwardRef(MediaRenderer);
