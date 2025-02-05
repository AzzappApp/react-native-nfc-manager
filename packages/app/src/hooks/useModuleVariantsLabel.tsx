import { useIntl } from 'react-intl';
import type { ModuleKindSectionName } from '#helpers/webcardModuleHelpers';

export function useVariantLabel({
  moduleKind,
  variant,
}: {
  moduleKind: string;
  variant: string;
}) {
  const intl = useIntl();
  switch (moduleKind) {
    case 'lineDivider':
      return intl.formatMessage({
        defaultMessage: 'Divider',
        description: 'useModuleVariant - Module line Divider',
      });
    case 'carousel':
      return intl.formatMessage({
        defaultMessage: 'Carousel',
        description: 'useModuleVariant - Module line Carousel',
      });
    case 'simpleButton':
      return intl.formatMessage({
        defaultMessage: 'Button',
        description: 'useModuleVariant - Module line Button',
      });
    case 'horizontalPhoto':
      return intl.formatMessage({
        defaultMessage: 'Image',
        description: 'useModuleVariant - Module line Image',
      });
    case 'simpleTitle':
      return intl.formatMessage({
        defaultMessage: 'Title',
        description: 'useModuleVariant - Module line Title',
      });
    case 'simpleText':
      return intl.formatMessage({
        defaultMessage: 'Text',
        description: 'useModuleVariant - Module line Text',
      });
    case 'blockText':
      return intl.formatMessage({
        defaultMessage: 'Text Block',
        description: 'useModuleVariant - Module line Text Block',
      });
    case 'photoWithTextAndTitle':
      return intl.formatMessage({
        defaultMessage: 'Text Image',
        description: 'useModuleVariant - Module line Photo with Text and Title',
      });
    case 'socialLinks':
      return intl.formatMessage({
        defaultMessage: 'Links',
        description: 'useModuleVariant - Module line Social Links',
      });
    case 'media':
      switch (variant) {
        case 'slideshow':
          return intl.formatMessage({
            defaultMessage: 'SlideShow',
            description: 'useModuleVariant - Module media Slideshow',
          });
        case 'parallax':
          return intl.formatMessage({
            defaultMessage: 'Parallax',
            description: 'useModuleVariant - Module media Parallax',
          });
        case 'original':
          return intl.formatMessage({
            defaultMessage: 'Original',
            description: 'useModuleVariant - Module media Original',
          });
        case 'fullscreen':
          return intl.formatMessage({
            defaultMessage: 'Fullscreen',
            description: 'useModuleVariant - Module media Fullscreen',
          });
        case 'grid':
          return intl.formatMessage({
            defaultMessage: 'Grid',
            description: 'useModuleVariant - Module media Grid',
          });
        case 'square_grid':
          return intl.formatMessage({
            defaultMessage: 'Square Grid',
            description: 'useModuleVariant - Module media Square Grid',
          });
        case 'grid2':
          return intl.formatMessage({
            defaultMessage: 'Grid 2 columns',
            description: 'useModuleVariant - Module media Grid  2 columns',
          });
        case 'square_grid2':
          return intl.formatMessage({
            defaultMessage: 'Square Grid 2 columns',
            description:
              'useModuleVariant - Module media Square Grid 2 columns',
          });
        case 'original_slideshow':
          return intl.formatMessage({
            defaultMessage: 'Original Slideshow',
            description: 'useModuleVariant - Module media Original Slideshow',
          });
        case 'full_slideshow':
          return intl.formatMessage({
            defaultMessage: 'Full Slideshow',
            description: 'useModuleVariant - Module media Full Slideshow',
          });
        case 'full_grid':
          return intl.formatMessage({
            defaultMessage: 'Full Grid',
            description: 'useModuleVariant - Module media Full Grid',
          });
        case 'zoom_out_fade':
          return intl.formatMessage({
            defaultMessage: 'Zoom Out Fade',
            description: 'useModuleVariant - Module media Zoom Out Fade',
          });
        case 'parallax_small':
          return intl.formatMessage({
            defaultMessage: 'Parallax Small',
            description: 'useModuleVariant - Module media Parallax Small',
          });
        default:
          return intl.formatMessage({
            defaultMessage: 'Unknown Variant',
            description: 'useModuleVariant - Unknown Variant',
          });
      }
    case 'mediaText':
      switch (variant) {
        case 'alternation':
          return intl.formatMessage({
            defaultMessage: 'Alternation',
            description: 'useModuleVariant - Module media text Alternation',
          });
        case 'parallax':
          return intl.formatMessage({
            defaultMessage: 'Parallax',
            description: 'useModuleVariant - Module media text Parallax',
          });
        case 'full_alternation':
          return intl.formatMessage({
            defaultMessage: 'Full Alternation',
            description:
              'useModuleVariant - Module media text Full Alternation',
          });
        case 'simple_carousel':
          return intl.formatMessage({
            defaultMessage: 'Simple carousel',
            description: 'useModuleVariant - Module media text Simple carousel',
          });
        case 'article':
          return intl.formatMessage({
            defaultMessage: 'Article',
            description: 'useModuleVariant - Module media text Article',
          });
        case 'grid':
          return intl.formatMessage({
            defaultMessage: 'Grid',
            description: 'useModuleVariant - Module media text Grid',
          });
        case 'superposition':
          return intl.formatMessage({
            defaultMessage: 'Superposition',
            description: 'useModuleVariant - Module media text Superposition',
          });
        case 'card':
          return intl.formatMessage({
            defaultMessage: 'Card',
            description: 'useModuleVariant - Module media text Card',
          });
        case 'card_gradient':
          return intl.formatMessage({
            defaultMessage: 'Card Gradient',
            description: 'useModuleVariant - Module media text Card Gradient',
          });
        default:
          return intl.formatMessage({
            defaultMessage: 'Unknown Variant',
            description: 'useModuleVariant - Unknown Variant',
          });
      }
    case 'mediaTextLink':
      switch (variant) {
        case 'alternation':
          return intl.formatMessage({
            defaultMessage: 'Alternation',
            description:
              'useModuleVariant - Module media text link Alternation',
          });
        case 'parallax':
          return intl.formatMessage({
            defaultMessage: 'Parallax',
            description: 'useModuleVariant - Module media text link Parallax',
          });
        case 'full_alternation':
          return intl.formatMessage({
            defaultMessage: 'Full Alternation',
            description:
              'useModuleVariant - Module media text link Full Alternation',
          });
        case 'article':
          return intl.formatMessage({
            defaultMessage: 'Article',
            description: 'useModuleVariant - Module media text link Article',
          });
        case 'button_round':
          return intl.formatMessage({
            defaultMessage: 'Button Round',
            description:
              'useModuleVariant - Module media text link Button Round',
          });
        case 'button_square':
          return intl.formatMessage({
            defaultMessage: 'Button Square',
            description:
              'useModuleVariant - Module media text link Button Square',
          });
        case 'list':
          return intl.formatMessage({
            defaultMessage: 'List',
            description: 'useModuleVariant - Module media text link List',
          });
        case 'card':
          return intl.formatMessage({
            defaultMessage: 'Card',
            description: 'useModuleVariant - Module media text link Card',
          });
        case 'card_gradient':
          return intl.formatMessage({
            defaultMessage: 'Card Gradient',
            description:
              'useModuleVariant - Module media text link Card Gradient',
          });
        case 'grid':
          return intl.formatMessage({
            defaultMessage: 'Grid',
            description: 'useModuleVariant - Module media text link Grid',
          });
        default:
          return intl.formatMessage({
            defaultMessage: 'Unknown Variant',
            description: 'useModuleVariant - Unknown Variant',
          });
      }
    case 'map':
      switch (variant) {
        case 'map_s':
          return intl.formatMessage({
            defaultMessage: 'Small Map',
            description: 'useModuleVariant - Module map Small Map',
          });
        case 'map_m':
          return intl.formatMessage({
            defaultMessage: 'Medium Map',
            description: 'useModuleVariant - Module map Medium Map',
          });
        case 'map_l':
          return intl.formatMessage({
            defaultMessage: 'Large Map',
            description: 'useModuleVariant - Module map Large Map',
          });
        case 'map_s_full':
          return intl.formatMessage({
            defaultMessage: 'Small Full Map',
            description: 'useModuleVariant - Module map Small Full Map',
          });
        case 'map_m_full':
          return intl.formatMessage({
            defaultMessage: 'Medium Full Map',
            description: 'useModuleVariant - Module map Medium Full Map',
          });
        case 'map_l_full':
          return intl.formatMessage({
            defaultMessage: 'Large Full Map',
            description: 'useModuleVariant - Module map Large Full Map',
          });
        default:
          return intl.formatMessage({
            defaultMessage: 'Unknown Variant',
            description: 'useModuleVariant - Unknown Variant',
          });
      }
    case 'titleText':
      switch (variant) {
        case 'left':
          return intl.formatMessage({
            defaultMessage: 'Left',
            description: 'useModuleVariant - Module title text Left',
          });
        case 'center':
          return intl.formatMessage({
            defaultMessage: 'Center',
            description: 'useModuleVariant - Module title text Center',
          });
        case 'right':
          return intl.formatMessage({
            defaultMessage: 'Right',
            description: 'useModuleVariant - Module title text Right',
          });
        case 'justified':
          return intl.formatMessage({
            defaultMessage: 'Justified',
            description: 'useModuleVariant - Module title text Justified',
          });
        case 'column_1':
          return intl.formatMessage({
            defaultMessage: 'Column 1',
            description: 'useModuleVariant - Module title text Column 1',
          });
        case 'column_1_justified':
          return intl.formatMessage({
            defaultMessage: 'Column 1 Justified',
            description:
              'useModuleVariant - Module title text Column 1 Justified',
          });
        case 'column_2':
          return intl.formatMessage({
            defaultMessage: 'Column 2',
            description: 'useModuleVariant - Module title text Column 2',
          });
        case 'column_2_justified':
          return intl.formatMessage({
            defaultMessage: 'Column 2 Justified',
            description:
              'useModuleVariant - Module title text Column 2 Justified',
          });
        case 'column_3':
          return intl.formatMessage({
            defaultMessage: 'Column 3',
            description: 'useModuleVariant - Module title text Column 3',
          });
        case 'column_3_justified':
          return intl.formatMessage({
            defaultMessage: 'Column 3 Justified',
            description:
              'useModuleVariant - Module title text Column 3 Justified',
          });
        case 'column_4':
          return intl.formatMessage({
            defaultMessage: 'Column 4',
            description: 'useModuleVariant - Module title text Column 4',
          });
        case 'column_4_justified':
          return intl.formatMessage({
            defaultMessage: 'Column 4 Justified',
            description:
              'useModuleVariant - Module title text Column 4 Justified',
          });
        default:
          return intl.formatMessage({
            defaultMessage: 'Unknown Variant',
            description: 'useModuleVariant - Unknown Variant',
          });
      }
    default:
      return intl.formatMessage({
        defaultMessage: 'Unknown Module',
        description: 'useModuleVariant - Unknown Module',
      });
  }
}
export default useVariantLabel;

export function useModuleLabel(section: ModuleKindSectionName) {
  const intl = useIntl();

  switch (section) {
    case 'custom':
      return intl.formatMessage({
        defaultMessage: 'Custom',
        description: 'useModuleVariant - Module custom',
      });
    case 'media':
      return intl.formatMessage({
        defaultMessage: 'Media',
        description: 'useModuleVariant - Module media',
      });
    case 'mediaText':
      return intl.formatMessage({
        defaultMessage: 'Media with text',
        description: 'useModuleVariant - Module media text',
      });
    case 'mediaTextLink':
      return intl.formatMessage({
        defaultMessage: 'Media with text & link',
        description:
          'CardModuleHeader - Media Text & link section header title',
      });
    case 'map':
      return intl.formatMessage({
        defaultMessage: 'Map',
        description: 'CardModuleHeader - Map section header title',
      });
    case 'titleText':
      return intl.formatMessage({
        defaultMessage: 'Title & Text',
        description: 'CardModuleHeader - Title & Text section header title',
      });
    //INSERT_MODULE
  }
}
