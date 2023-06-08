import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import BottomMenu from '#ui/BottomMenu';
import type { BottomMenuProps } from '#ui/BottomMenu';

type HorizontalPhotoEditionBottomMenuProps = Omit<
  BottomMenuProps,
  'showLabel' | 'tabs'
>;
/**
 * The bottom menu of the HorizontalPhoto edition screen
 */
const HorizontalPhotoEditionBottomMenu = (
  props: HorizontalPhotoEditionBottomMenuProps,
) => {
  const intl = useIntl();

  return (
    <BottomMenu
      tabs={useMemo(
        () => [
          {
            key: 'settings',
            icon: 'settings',
            label: intl.formatMessage({
              defaultMessage: 'Settgins',
              description: 'HorizontalPhoto bottom menu label for settings tab',
            }),
          },
          {
            key: 'border',
            icon: 'border',
            label: intl.formatMessage({
              defaultMessage: 'Edit border',
              description: 'HorizontalPhoto bottom menu label for border tab',
            }),
          },
          {
            key: 'margins',
            icon: 'margins',
            label: intl.formatMessage({
              defaultMessage: 'Edit margins',
              description: 'HorizontalPhoto bottom menu label for margins tab',
            }),
          },
          {
            key: 'background',
            icon: 'background',
            label: intl.formatMessage({
              defaultMessage: 'Edit the background',
              description:
                'HorizontalPhoto bottom menu label for background tab',
            }),
          },
          {
            key: 'preview',
            icon: 'preview',
            label: intl.formatMessage({
              defaultMessage: 'Preview',
              description: 'HorizontalPhoto bottom menu label for Preview tab',
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

export default HorizontalPhotoEditionBottomMenu;
