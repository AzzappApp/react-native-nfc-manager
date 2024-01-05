import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import BottomMenu from '#ui/BottomMenu';
import type { BottomMenuProps } from '#ui/BottomMenu';

type PhotoWithTextAndTitleEditionBottomMenuProps = Omit<
  BottomMenuProps,
  'showLabel' | 'tabs'
>;
/**
 * The bottom menu of the PhotoWithTextAndTitle edition screen
 */
const PhotoWithTextAndTitleEditionBottomMenu = (
  props: PhotoWithTextAndTitleEditionBottomMenuProps,
) => {
  const intl = useIntl();

  return (
    <BottomMenu
      tabs={useMemo(
        () => [
          {
            key: 'text',
            icon: 'text',
            label: intl.formatMessage({
              defaultMessage: 'Edit Settings',
              description:
                'PhotoWithTextAndTitle bottom menu label for Settings tab',
            }),
          },
          {
            key: 'editor',
            icon: 'keyboard',
            label: intl.formatMessage({
              defaultMessage: 'Edit editor',
              description:
                'PhotoWithTextAndTitle bottom menu label for editor tab',
            }),
          },
          {
            key: 'image',
            icon: 'image',
            label: intl.formatMessage({
              defaultMessage: 'Edit Settings',
              description:
                'PhotoWithTextAndTitle bottom menu label for Settings tab',
            }),
          },
          {
            key: 'margins',
            icon: 'margins',
            label: intl.formatMessage({
              defaultMessage: 'Edit Margins',
              description:
                'PhotoWithTextAndTitle bottom menu label for Margins tab',
            }),
          },
          {
            key: 'background',
            icon: 'background',
            label: intl.formatMessage({
              defaultMessage: 'Edit Background',
              description:
                'PhotoWithTextAndTitle bottom menu label for Background tab',
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

export default PhotoWithTextAndTitleEditionBottomMenu;
