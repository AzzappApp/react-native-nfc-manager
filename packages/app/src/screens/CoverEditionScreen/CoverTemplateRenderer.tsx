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
  uri: string;
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
  /**
   * The height of the cover
   */
  height: number;

  /**
   * Callback called when the component is ready
   */
  onReady?: () => void;
  /**
   * Callback called when the component is ready
   */
  onError?: () => void;
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
  height,
  onReady,
  onError,
  ...props
}: CoverTemplateRendererProps) => {
  const coverTemplate = useFragment(
    graphql`
      fragment CoverTemplateRenderer_template on CoverTemplate {
        id
        colorPalette
        kind
        data {
          mediaStyle
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
          contentStyle {
            orientation
            placement
          }
          titleStyle {
            fontFamily
            fontSize
            color
          }
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
      mediaStyle,
      background,
      backgroundStyle,
      foreground,
      foregroundStyle,
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
        // uri={(uri ?? sourceMedia?.templateURI)!}
        uri={uri}
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
        onLoadingEnd={onReady}
        onLoadingError={onError}
      />
      <CoverTextPreview
        title={title}
        subTitle={subTitle}
        titleStyle={titleStyle}
        subTitleStyle={subTitleStyle}
        contentStyle={contentStyle}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        height={height}
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
