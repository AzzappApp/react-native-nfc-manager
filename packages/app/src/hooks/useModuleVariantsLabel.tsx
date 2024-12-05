import { useIntl } from 'react-intl';
import type {
  ModuleKindWithVariant,
  ModuleKindSectionName,
} from '#helpers/webcardModuleHelpers';

export function useVariantLabel({
  moduleKind,
  variant,
}: ModuleKindWithVariant) {
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
      }
      break;
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
      }
      break;
    case 'mediaTextLink':
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
      }
    //INSERT_MODULE
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
    //INSERT_MODULE
  }
}
