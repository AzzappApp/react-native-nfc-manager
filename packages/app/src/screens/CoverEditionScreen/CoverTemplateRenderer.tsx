import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import CoverMediaPreview from './CoverMediaPreview';
import CoverTextPreview from './CoverTextPreview';
import type { EditionParameters } from '#components/gpu';
import type { CoverTemplateRenderer_template$key } from '@azzapp/relay/artifacts/CoverTemplateRenderer_template.graphql';
import type { ViewProps } from 'react-native';

type CoverTemplateRendererProps = ViewProps & {
  /**
   * the cover template to render
   *
   */
  template: CoverTemplateRenderer_template$key;
  /**
   * Source Media to Override the Source Media of the template
   */
  uri?: string;
  /**
   * The source media type
   */
  kind?: 'image' | 'video' | 'videoFrame';
  /**
   * if the source media is a videoFrame, the time of the frame to display
   */
  time?: number | null;
  /**
   * the mask image uri
   */
  maskUri?: string | null;
  /**
   * Title to Override the title of the template
   *
   * @type {string}
   */
  title?: string | null;
  /**
   * SubTitle to Override the SubTitle of the template
   *
   * @type {string}
   */
  subTitle?: string | null;
  /**
   * The edition parameters to applied to the media
   */
  editionParameters?: EditionParameters;
};

const CoveTemplateRenderer = ({
  template,
  uri,
  kind,
  maskUri,
  time,
  title,
  subTitle,
  editionParameters,
  ...props
}: CoverTemplateRendererProps) => {
  const coverTemplate = useFragment(
    graphql`
      fragment CoverTemplateRenderer_template on CoverTemplate
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
        isNative: {
          type: "Boolean!"
          provider: "../providers/isNative.relayprovider"
        }
      ) {
        id
        colorPalette
        kind
        data {
          mediaStyle
          sourceMedia {
            id
            width
            height
            templateURI: uri(width: 200, pixelRatio: $pixelRatio)
              @include(if: $isNative)
          }
          background {
            id
            uri
          }
          backgroundStyle {
            backgroundColor
            patternColor
          }
          foreground {
            id
            uri
          }
          foregroundStyle {
            color
          }
          segmented
          merged
          title
          contentStyle {
            orientation
            placement
          }
          titleStyle {
            fontFamily
            fontSize
            color
          }
          subTitle
          subTitleStyle {
            fontFamily
            fontSize
            color
          }
        }
      }
    `,
    template,
  );

  const {
    data: {
      sourceMedia,
      mediaStyle,
      background,
      backgroundStyle,
      foreground,
      foregroundStyle,
      title: titleTemplate,
      subTitle: subTitleTemplate,
      titleStyle,
      subTitleStyle,
      contentStyle,
      merged,
      segmented,
    },
  } = coverTemplate;

  //doing this to avoid typescript error in render ...
  const editionParametersMerged: EditionParameters = {
    ...(mediaStyle?.parameters ?? {}),
    cropData: editionParameters?.cropData,
    orientation: editionParameters?.orientation,
  };

  const filter = coverTemplate.data.mediaStyle
    ? (coverTemplate.data.mediaStyle.filter as string)
    : null;

  return (
    <View {...props}>
      <CoverMediaPreview
        uri={(uri ?? sourceMedia?.templateURI)!}
        kind={kind === 'video' ? 'videoFrame' : kind ?? 'image'}
        time={time}
        backgroundColor={backgroundStyle?.backgroundColor}
        maskUri={segmented ? maskUri : null}
        backgroundImageUri={background?.uri}
        backgroundImageTintColor={backgroundStyle?.patternColor}
        foregroundImageUri={foreground?.uri}
        foregroundImageTintColor={foregroundStyle?.color}
        backgroundMultiply={merged}
        filter={filter}
        editionParameters={editionParametersMerged}
        style={StyleSheet.absoluteFill}
      />
      <CoverTextPreview
        title={title ?? titleTemplate}
        subTitle={subTitle ?? subTitleTemplate}
        titleStyle={titleStyle}
        subTitleStyle={subTitleStyle}
        contentStyle={contentStyle}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

      <Image
        testID="cover-renderer-qrcode"
        accessibilityRole="image"
        source={require('#assets/qrcode.png')}
        style={styles.qrCode}
      />
    </View>
  );
};

export default memo(CoveTemplateRenderer);

const styles = StyleSheet.create({
  qrCode: {
    position: 'absolute',
    top: '10%',
    height: '6.5%',
    left: '45%',
    width: '10%',
  },
});
