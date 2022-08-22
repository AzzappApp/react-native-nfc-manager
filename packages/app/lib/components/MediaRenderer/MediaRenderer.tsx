import { forwardRef } from 'react';
import { View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '../../../theme';
import MediaImageRenderer from './MediaImageRenderer';
import MediaVideoRenderer from './MediaVideoRenderer';
import type { MediaInnerRendererProps, MediaRendererOptions } from './types';
import type { MediaRendererFragment_media$key } from '@azzapp/relay/artifacts/MediaRendererFragment_media.graphql';
import type { ComponentType, ForwardedRef } from 'react';
import type { StyleProp, HostComponent, ImageStyle } from 'react-native';

type MediaRendererProps = MediaRendererOptions & {
  media: MediaRendererFragment_media$key;
  width: number | `${number}vw`;
  style?: StyleProp<ImageStyle>;
  nativeID?: string;
  testID?: string;
};

const MediaRenderer = (
  { media, width, style, ...options }: MediaRendererProps,
  ref: ForwardedRef<HostComponent<any>>,
) => {
  const { kind, source, uri, ratio } = useFragment(
    graphql`
      fragment MediaRendererFragment_media on Media
      @argumentDefinitions(
        width: { type: "Float!" }
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
        cappedPixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
        isNative: {
          type: "Boolean!"
          provider: "../providers/isNative.relayprovider"
        }
        priority: { type: "Boolean!", defaultValue: true }
      ) {
        kind
        ratio
        source
        ... on Media @include(if: $isNative) {
          uri(width: $width, pixelRatio: $pixelRatio) @include(if: $priority)
          uri(width: $width, pixelRatio: $cappedPixelRatio) @skip(if: $priority)
        }
      }
    `,
    media,
  );

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
  const sizeStyles = { width, aspectRatio: ratio };
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
      aspectRatio={ratio}
      style={[sizeStyles, style]}
      {...options}
    />
  );
};

export default forwardRef(MediaRenderer);
