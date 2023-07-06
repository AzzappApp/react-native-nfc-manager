import { View, Image } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { HORIZONTAL_PHOTO_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from './CardModuleBackground';
import type {
  HorizontalPhotoRenderer_module$data,
  HorizontalPhotoRenderer_module$key,
} from '@azzapp/relay/artifacts/HorizontalPhotoRenderer_module.graphql';
import type { ViewProps } from 'react-native';

export type HorizontalPhotoRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a HorizontalPhoto module
   */
  module: HorizontalPhotoRenderer_module$key;
};

/**
 * Render a HorizontalPhoto module
 */
const HorizontalPhotoRenderer = ({
  module,
  ...props
}: HorizontalPhotoRendererProps) => {
  const data = useFragment(
    graphql`
      fragment HorizontalPhotoRenderer_module on CardModule
      @argumentDefinitions(
        screenWidth: {
          type: "Float!"
          provider: "../providers/ScreenWidth.relayprovider"
        }
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
      ) {
        id
        ... on CardModuleHorizontalPhoto {
          borderWidth
          borderRadius
          borderColor
          marginHorizontal
          marginVertical
          height
          background {
            id
            uri
          }
          backgroundStyle {
            backgroundColor
            patternColor
          }
          image {
            id
            uri(width: $screenWidth, pixelRatio: $pixelRatio)
          }
        }
      }
    `,
    module,
  );

  return <HorizontalPhotoRendererRaw data={data} {...props} />;
};

export default HorizontalPhotoRenderer;

export type HorizontalPhotoRawData = Omit<
  HorizontalPhotoRenderer_module$data,
  ' $fragmentType'
>;

type HorizontalPhotoRendererRawProps = ViewProps & {
  /**
   * The data for the HorizontalPhoto module
   */
  data: HorizontalPhotoRawData;
};

/**
 * Raw implementation of the HorizontalPhoto module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const HorizontalPhotoRendererRaw = ({
  data,
  style,
  ...props
}: HorizontalPhotoRendererRawProps) => {
  const {
    borderWidth,
    borderRadius,
    borderColor,
    marginHorizontal,
    marginVertical,
    height,
    background,
    backgroundStyle,
    image,
  } = Object.assign({}, HORIZONTAL_PHOTO_DEFAULT_VALUES, data);

  return (
    <CardModuleBackground
      {...props}
      backgroundUri={background?.uri}
      backgroundColor={backgroundStyle?.backgroundColor}
      patternColor={backgroundStyle?.patternColor}
      style={style}
    >
      {image?.uri && (
        <View
          style={{
            height,
            borderWidth,
            borderRadius,
            marginHorizontal,
            marginVertical,
            borderColor,
            overflow: 'hidden',
          }}
        >
          <Image
            source={{ uri: image.uri }}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
        </View>
      )}
    </CardModuleBackground>
  );
};
