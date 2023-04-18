import { useMemo, memo } from 'react';
import { useIntl } from 'react-intl';
import { Dimensions, PixelRatio, StyleSheet } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import CoverPreviewRenderer from '#screens/CoverEditionScreen/CoverPreviewRenderer';
import PressableNative from '#ui/PressableNative';
import type { EditableImageSource } from '#components/medias';
import type { ImageEditionParameters } from '#helpers/mediaHelpers';
import type { CoverTemplateRenderer_template$key } from '@azzapp/relay/artifacts/CoverTemplateRenderer_template.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type CoverTemplateRendererProps = {
  /**
   * the cover template to render
   *
   */
  template: CoverTemplateRenderer_template$key;
  /**
   * A callback called when the user select this template
   */
  onPress(): void;
  /**
   * the width of the cover
   *
   * @type {number}
   */
  coverWidth?: number;
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
   * Source Media to Override the Source Media of the template
   */
  sourceMedia?: { uri: string; width: number; height: number };
  /**
   * add shadow on cover
   *
   * @type {(boolean | null)}
   */
  withShadow?: boolean | null;

  /**
   * Additional style to apply to the container of the CoverTemplateRenderer
   */
  style?: StyleProp<ViewStyle>;
};

const CoveTemplateRenderer = ({
  template,
  onPress,
  coverWidth = TEMPLATE_SELECTOR_ITEM_WIDTH,
  title,
  subTitle,
  sourceMedia,
  withShadow = true,
  style,
}: CoverTemplateRendererProps) => {
  const cover = useFragment(
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

  const editableImageSource: EditableImageSource = useMemo(() => {
    return {
      uri:
        cover.kind !== 'personal'
          ? cover.data.sourceMedia.templateURI
          : sourceMedia?.uri ?? cover.data.sourceMedia.templateURI,
      backgroundUri: cover.data.background?.uri,
      foregroundUri: cover.data.foreground?.uri,
      kind: 'image',
    };
  }, [
    cover.data.background?.uri,
    cover.data.foreground?.uri,
    cover.data.sourceMedia.templateURI,
    cover.kind,
    sourceMedia?.uri,
  ]);

  //doing this to avoid typescript error in render ...
  const editionParameters: ImageEditionParameters =
    cover.data.mediaStyle?.parameters ?? {};

  const filter = cover.data.mediaStyle
    ? (cover.data.mediaStyle.filter as string)
    : null;

  const intl = useIntl();

  return (
    <PressableNative
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={intl.formatMessage({
        defaultMessage: 'Select this cover template template for your profile',
        description:
          'TemplateSelectorTemplateItem accessibilityHint template item',
      })}
      style={style}
    >
      <CoverPreviewRenderer
        source={editableImageSource}
        mediaSize={
          sourceMedia
            ? {
                width: sourceMedia.width,
                height: sourceMedia.height,
              }
            : {
                width: coverWidth * PIXEL_RATIO,
                height: (coverWidth * PIXEL_RATIO) / COVER_RATIO,
              }
        }
        foregroundImageTintColor={cover.data.foregroundStyle?.color}
        backgroundImageColor={cover.data.backgroundStyle?.backgroundColor}
        backgroundMultiply={cover.data.merged}
        backgroundImageTintColor={cover.data.backgroundStyle?.patternColor}
        editionParameters={editionParameters}
        filter={filter}
        title={title ?? cover.data.title}
        subTitle={subTitle ?? cover.data.subTitle}
        titleStyle={cover.data.titleStyle}
        subTitleStyle={cover.data.subTitleStyle}
        contentStyle={cover.data.contentStyle}
        computing={false}
        cropEditionMode={false}
        style={withShadow ? styles.coverShadow : undefined}
      />
    </PressableNative>
  );
};

export default memo(CoveTemplateRenderer);

// TODO refactor this static PixelRatio.get() is deprecated
const PIXEL_RATIO = PixelRatio.get();
const RATIO_TEMPLATE = 7 / 15;
const { width } = Dimensions.get('window');
export const TEMPLATE_SELECTOR_ITEM_WIDTH = width * RATIO_TEMPLATE;

const styles = StyleSheet.create({
  coverShadow: {
    shadowColor: colors.black,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 17,
    elevation: 6,
  },
});
