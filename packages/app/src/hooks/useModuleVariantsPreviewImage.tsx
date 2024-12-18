import { useColorScheme } from 'react-native';

import type { ModuleKindWithVariant } from '#helpers/webcardModuleHelpers';

const notFoundAsset = require('#assets/noSpec.png');

function useModuleVariantsPreviewImage({
  moduleKind,
  variant,
}: ModuleKindWithVariant) {
  const colorScheme = useColorScheme();

  switch (moduleKind) {
    case 'lineDivider':
      return colorScheme === 'light'
        ? require('#assets/module/custom_lineDivider_light.png')
        : require('#assets/module/custom_lineDivider_dark.png');
    case 'carousel':
      return colorScheme === 'light'
        ? require('#assets/module/custom_carousel_light.png')
        : require('#assets/module/custom_carousel_dark.png');
    case 'simpleButton':
      return colorScheme === 'light'
        ? require('#assets/module/custom_simpleButton_light.png')
        : require('#assets/module/custom_simpleButton_dark.png');
    case 'horizontalPhoto':
      return colorScheme === 'light'
        ? require('#assets/module/custom_horizontalPhoto_light.png')
        : require('#assets/module/custom_horizontalPhoto_dark.png');
    case 'simpleTitle':
      return colorScheme === 'light'
        ? require('#assets/module/custom_simpleTitle_light.png')
        : require('#assets/module/custom_simpleTitle_dark.png');
    case 'simpleText':
      return colorScheme === 'light'
        ? require('#assets/module/custom_simpleText_light.png')
        : require('#assets/module/custom_simpleText_dark.png');
    case 'photoWithTextAndTitle':
      return colorScheme === 'light'
        ? require('#assets/module/custom_photoWithTextAndTitle_light.png')
        : require('#assets/module/custom_photoWithTextAndTitle_dark.png');
    case 'socialLinks':
      return colorScheme === 'light'
        ? require('#assets/module/custom_socialLinks_light.png')
        : require('#assets/module/custom_socialLinks_dark.png');
    case 'media':
      switch (variant) {
        case 'slideshow':
          return colorScheme === 'light'
            ? require('#assets/module/media_slideshow_light.png')
            : require('#assets/module/media_slideshow_dark.png');
        case 'parallax':
          return colorScheme === 'light'
            ? require('#assets/module/media_parallax_light.png')
            : require('#assets/module/media_parallax_dark.png');
        default:
          return notFoundAsset;
      }
    case 'mediaText': {
      switch (variant) {
        case 'alternation':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_alternation_light.png')
            : require('#assets/module/media_text_alternation_dark.png');
        case 'parallax':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_parallax_light.png')
            : require('#assets/module/media_text_parallax_dark.png');
        default:
          return notFoundAsset;
      }
    }
    case 'mediaTextLink': {
      switch (variant) {
        case 'alternation':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_link_alternation_light.png')
            : require('#assets/module/media_text_link_alternation_dark.png');
        case 'parallax':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_link_parallax_light.png')
            : require('#assets/module/media_text_link_parallax_dark.png');
        default:
          return notFoundAsset;
      }
    }
    default:
      return notFoundAsset;
  }
}

export default useModuleVariantsPreviewImage;
