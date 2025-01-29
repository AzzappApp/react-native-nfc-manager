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
    case 'blockText':
      return colorScheme === 'light'
        ? require('#assets/module/custom_blockText_light.png')
        : require('#assets/module/custom_blockText_dark.png');
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
        case 'original':
          return colorScheme === 'light'
            ? require('#assets/module/media_original_light.png')
            : require('#assets/module/media_original_dark.png');
        case 'fullscreen':
          return colorScheme === 'light'
            ? require('#assets/module/media_fullscreen_light.png')
            : require('#assets/module/media_fullscreen_dark.png');
        case 'grid':
          return colorScheme === 'light'
            ? require('#assets/module/media_grid_light.png')
            : require('#assets/module/media_grid_dark.png');
        case 'square_grid':
          return colorScheme === 'light'
            ? require('#assets/module/media_square_grid_light.png')
            : require('#assets/module/media_square_grid_dark.png');
        case 'grid2':
          return colorScheme === 'light'
            ? require('#assets/module/media_grid2_light.png')
            : require('#assets/module/media_grid2_dark.png');
        case 'square_grid2':
          return colorScheme === 'light'
            ? require('#assets/module/media_square_grid2_light.png')
            : require('#assets/module/media_square_grid2_dark.png');
        case 'original_slideshow':
          return colorScheme === 'light'
            ? require('#assets/module/media_original_slideshow_light.png')
            : require('#assets/module/media_original_slideshow_dark.png');
        case 'full_slideshow':
          return colorScheme === 'light'
            ? require('#assets/module/media_full_slideshow_light.png')
            : require('#assets/module/media_full_slideshow_dark.png');
        case 'full_grid':
          return colorScheme === 'light'
            ? require('#assets/module/media_full_grid_light.png')
            : require('#assets/module/media_full_grid_dark.png');
        case 'zoom_out_fade':
          return colorScheme === 'light'
            ? require('#assets/module/media_zoom_out_fade_light.png')
            : require('#assets/module/media_zoom_out_fade_dark.png');
        case 'parallax_small':
          return colorScheme === 'light'
            ? require('#assets/module/media_parallax_small_light.png')
            : require('#assets/module/media_parallax_small_dark.png');
        default:
          return notFoundAsset;
      }
    case 'mediaText':
      switch (variant) {
        case 'alternation':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_alternation_light.png')
            : require('#assets/module/media_text_alternation_dark.png');
        case 'parallax':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_parallax_light.png')
            : require('#assets/module/media_text_parallax_dark.png');
        case 'full_alternation':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_full_alternation_light.png')
            : require('#assets/module/media_text_full_alternation_dark.png');
        case 'simple_carousel':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_simple_carousel_light.png')
            : require('#assets/module/media_text_simple_carousel_dark.png');
        case 'article':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_article_light.png')
            : require('#assets/module/media_text_article_dark.png');
        case 'grid':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_grid_light.png')
            : require('#assets/module/media_text_grid_dark.png');
        case 'superposition':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_superposition_light.png')
            : require('#assets/module/media_text_superposition_dark.png');
        case 'card':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_card_light.png')
            : require('#assets/module/media_text_card_dark.png');
        case 'card_gradient':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_card_gradient_light.png')
            : require('#assets/module/media_text_card_gradient_dark.png');
        default:
          return notFoundAsset;
      }
    case 'mediaTextLink':
      switch (variant) {
        case 'alternation':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_link_alternation_light.png')
            : require('#assets/module/media_text_link_alternation_dark.png');
        case 'parallax':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_link_parallax_light.png')
            : require('#assets/module/media_text_link_parallax_dark.png');
        case 'full_alternation':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_link_full_alternation_light.png')
            : require('#assets/module/media_text_link_full_alternation_dark.png');
        case 'article':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_link_article_light.png')
            : require('#assets/module/media_text_link_article_dark.png');
        case 'button_round':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_link_button_round_light.png')
            : require('#assets/module/media_text_link_button_round_dark.png');
        case 'button_square':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_link_button_square_light.png')
            : require('#assets/module/media_text_link_button_square_dark.png');
        case 'list':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_link_list_light.png')
            : require('#assets/module/media_text_link_list_dark.png');
        case 'card':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_link_card_light.png')
            : require('#assets/module/media_text_link_card_dark.png');
        case 'card_gradient':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_link_card_gradient_light.png')
            : require('#assets/module/media_text_link_card_gradient_dark.png');
        case 'grid':
          return colorScheme === 'light'
            ? require('#assets/module/media_text_link_grid_light.png')
            : require('#assets/module/media_text_link_grid_dark.png');
        default:
          return notFoundAsset;
      }
    case 'map':
      switch (variant) {
        case 'map_s':
          return colorScheme === 'light'
            ? require('#assets/module/map_map_s_light.png')
            : require('#assets/module/map_map_s_dark.png');
        case 'map_m':
          return colorScheme === 'light'
            ? require('#assets/module/map_map_m_light.png')
            : require('#assets/module/map_map_m_dark.png');
        case 'map_l':
          return colorScheme === 'light'
            ? require('#assets/module/map_map_l_light.png')
            : require('#assets/module/map_map_l_dark.png');
        case 'map_s_full':
          return colorScheme === 'light'
            ? require('#assets/module/map_map_s_full_light.png')
            : require('#assets/module/map_map_s_full_dark.png');
        case 'map_m_full':
          return colorScheme === 'light'
            ? require('#assets/module/map_map_m_full_light.png')
            : require('#assets/module/map_map_m_full_dark.png');
        case 'map_l_full':
          return colorScheme === 'light'
            ? require('#assets/module/map_map_l_full_light.png')
            : require('#assets/module/map_map_l_full_dark.png');
        default:
          return notFoundAsset;
      }
    case 'titleText':
      switch (variant) {
        case 'left':
          return colorScheme === 'light'
            ? require('#assets/module/title_text_left_light.png')
            : require('#assets/module/title_text_left_dark.png');
        case 'center':
          return colorScheme === 'light'
            ? require('#assets/module/title_text_center_light.png')
            : require('#assets/module/title_text_center_dark.png');
        case 'right':
          return colorScheme === 'light'
            ? require('#assets/module/title_text_right_light.png')
            : require('#assets/module/title_text_right_dark.png');
        case 'justified':
          return colorScheme === 'light'
            ? require('#assets/module/title_text_justified_light.png')
            : require('#assets/module/title_text_justified_dark.png');
        case 'column_1':
          return colorScheme === 'light'
            ? require('#assets/module/title_text_column_1_light.png')
            : require('#assets/module/title_text_column_1_dark.png');
        case 'column_1_justified':
          return colorScheme === 'light'
            ? require('#assets/module/title_text_column_1_justified_light.png')
            : require('#assets/module/title_text_column_1_justified_dark.png');
        case 'column_2':
          return colorScheme === 'light'
            ? require('#assets/module/title_text_column_2_light.png')
            : require('#assets/module/title_text_column_2_dark.png');
        case 'column_2_justified':
          return colorScheme === 'light'
            ? require('#assets/module/title_text_column_2_justified_light.png')
            : require('#assets/module/title_text_column_2_justified_dark.png');
        case 'column_3':
          return colorScheme === 'light'
            ? require('#assets/module/title_text_column_3_light.png')
            : require('#assets/module/title_text_column_3_dark.png');
        case 'column_3_justified':
          return colorScheme === 'light'
            ? require('#assets/module/title_text_column_3_justified_light.png')
            : require('#assets/module/title_text_column_3_justified_dark.png');
        case 'column_4':
          return colorScheme === 'light'
            ? require('#assets/module/title_text_column_4_light.png')
            : require('#assets/module/title_text_column_4_dark.png');
        case 'column_4_justified':
          return colorScheme === 'light'
            ? require('#assets/module/title_text_column_4_justified_light.png')
            : require('#assets/module/title_text_column_4_justified_dark.png');
        default:
          return notFoundAsset;
      }
    default:
      return notFoundAsset;
  }
}

export default useModuleVariantsPreviewImage;
