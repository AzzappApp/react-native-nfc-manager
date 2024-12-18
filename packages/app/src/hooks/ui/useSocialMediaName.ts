import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import type { SocialLinkItemType } from '@azzapp/shared/socialLinkHelpers';

/*
 * Allow to get translated version of social link name
 * only usefull for website, mail, phone and link
 */
export const useSocialMediaName = (genericSocialType: SocialLinkItemType) => {
  const intl = useIntl();

  const label = useMemo(() => {
    switch (genericSocialType.id) {
      case 'website':
        return intl.formatMessage({
          defaultMessage: 'Website',
          description: 'Social Icon / Website',
        });
      case 'mail':
        return intl.formatMessage({
          defaultMessage: 'Mail',
          description: 'Social Icon / email',
        });
      case 'phone':
        return intl.formatMessage({
          defaultMessage: 'Phone',
          description: 'Social Icon / Phone',
        });
      case 'link':
        return intl.formatMessage({
          defaultMessage: 'Link',
          description: 'Social Icon / Link',
        });
      default:
        return genericSocialType.label;
    }
  }, [genericSocialType.id, genericSocialType.label, intl]);

  return label;
};
