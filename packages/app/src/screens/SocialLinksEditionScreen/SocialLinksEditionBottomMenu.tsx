import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import BottomMenu from '#ui/BottomMenu';
import type { BottomMenuProps } from '#ui/BottomMenu';

type SocialLinksEditionBottomMenuProps = Omit<
  BottomMenuProps,
  'showLabel' | 'tabs'
>;
/**
 * The bottom menu of the SocialLinks edition screen
 */
const SocialLinksEditionBottomMenu = (
  props: SocialLinksEditionBottomMenuProps,
) => {
  const intl = useIntl();

  return (
    <BottomMenu
      tabs={useMemo(
        () => [
          {
            key: 'links',
            icon: 'link',
            label: intl.formatMessage({
              defaultMessage: 'Edit Links',
              description: 'SocialLinks bottom menu label for Links tab',
            }),
          },
          {
            key: 'settings',
            icon: 'settings',
            label: intl.formatMessage({
              defaultMessage: 'Edit Settings',
              description: 'SocialLinks bottom menu label for Settings tab',
            }),
          },
          {
            key: 'margins',
            icon: 'margins',
            label: intl.formatMessage({
              defaultMessage: 'Edit Margins',
              description: 'SocialLinks bottom menu label for Margins tab',
            }),
          },
          {
            key: 'background',
            icon: 'background',
            label: intl.formatMessage({
              defaultMessage: 'Edit Background',
              description: 'SocialLinks bottom menu label for Background tab',
            }),
          },
        ],
        [intl],
      )}
      showLabel={false}
      {...props}
    />
  );
};

export default SocialLinksEditionBottomMenu;
