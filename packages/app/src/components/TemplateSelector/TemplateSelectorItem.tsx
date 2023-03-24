import { useMemo, useCallback, memo } from 'react';
import { useIntl } from 'react-intl';
import { Dimensions, PixelRatio } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import { COVER_RATIO } from '@azzapp/shared/cardHelpers';
import CoverEditionScreenCoverRenderer from '#screens/CoverEditionScreen/CoverEditionScreenCoverRenderer';
import PressableNative from '#ui/PressableNative';
import type { EditableImageSource } from '#components/medias';
import type { ImageEditionParameters } from '#helpers/mediaHelpers';
import type { TemplateSelectorItem_templateData$key } from '@azzapp/relay/artifacts/TemplateSelectorItem_templateData.graphql';

type TemplateSelectorTemplateItemProps = {
  /**
   * the selected CoverTEmplate
   *
   * @type {TemplateCover}
   */
  template: TemplateSelectorItem_templateData$key;
  /**
   * the index of the flatlist item (for styling purpose)
   *
   * @type {number}
   */
  index: number;
  /**
   * the function to call when the user select a template
   *
   */
  selectTemplate: (templateId: string) => void;
};

const TemplateSelectorTemplateItem = ({
  template,
  index,
  selectTemplate,
}: TemplateSelectorTemplateItemProps) => {
  const cover = useFragment(
    graphql`
      fragment TemplateSelectorItem_templateData on CoverTemplate
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
      uri: cover.data.sourceMedia.templateURI,
      backgroundUri: cover.data.background?.uri,
      foregroundUri: cover.data.foreground?.uri,
      kind: 'image',
    };
  }, [
    cover.data.background?.uri,
    cover.data.foreground?.uri,
    cover.data.sourceMedia.templateURI,
  ]);

  const onPress = useCallback(() => {
    selectTemplate(cover.id);
  }, [selectTemplate, cover.id]);

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
      style={{
        width: TEMPLATE_SELECTOR_ITEM_WIDTH,
        height: TEMPLATE_SELECTOR_ITEM_WIDTH / COVER_RATIO,
        marginLeft: index === 0 ? 13.5 : 0,
      }}
      accessibilityRole="link"
      accessibilityHint={intl.formatMessage({
        defaultMessage: 'Select this cover template template for your profile',
        description:
          'TemplateSelectorTemplateItem accessibilityHint template item',
      })}
    >
      <CoverEditionScreenCoverRenderer
        source={editableImageSource}
        mediaSize={{
          width: TEMPLATE_SELECTOR_ITEM_WIDTH * PIXEL_RATIO,
          height: (TEMPLATE_SELECTOR_ITEM_WIDTH * PIXEL_RATIO) / COVER_RATIO,
        }}
        foregroundImageTintColor={cover.data.foregroundStyle?.color}
        backgroundImageColor={cover.data.backgroundStyle?.backgroundColor}
        backgroundMultiply={cover.data.merged}
        backgroundImageTintColor={cover.data.backgroundStyle?.patternColor}
        editionParameters={editionParameters}
        filter={filter}
        title={cover.data.title}
        subTitle={cover.data.subTitle}
        titleStyle={cover.data.titleStyle}
        subTitleStyle={cover.data.subTitleStyle}
        contentStyle={cover.data.contentStyle}
        computing={cover.data.segmented}
        cropEditionMode={false}
      />
    </PressableNative>
  );
};

export default memo(TemplateSelectorTemplateItem);

const PIXEL_RATIO = PixelRatio.get();
const RATIO_TEMPLATE = 7 / 15;
const { width } = Dimensions.get('window');
export const TEMPLATE_SELECTOR_ITEM_WIDTH = width * RATIO_TEMPLATE;
