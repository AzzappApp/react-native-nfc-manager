import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import BottomMenu from '#ui/BottomMenu';
import type { BottomMenuProps } from '#ui/BottomMenu';

/**
 * The bottom menu of the carousel edition screen
 */
const CarouselEditionBottomMenu = (
  props: Omit<BottomMenuProps, 'showLabel' | 'tabs'>,
) => {
  const intl = useIntl();

  return (
    <BottomMenu
      tabs={useMemo(
        () => [
          {
            key: 'images',
            icon: 'image',
            label: intl.formatMessage({
              defaultMessage: 'Select images',
              description: 'Carousel bottom menu label for images tab',
            }),
          },
          {
            key: 'border',
            icon: 'border',
            label: intl.formatMessage({
              defaultMessage: 'Edit Text',
              description: 'Carousel bottom menu label for border tab',
            }),
          },
          {
            key: 'margins',
            icon: 'margins',
            label: intl.formatMessage({
              defaultMessage: 'Edit Margin',
              description: 'Carousel bottom menu label for margin tab',
            }),
          },
          {
            key: 'background',
            icon: 'background',
            label: intl.formatMessage({
              defaultMessage: 'Background',
              description: 'Carousel  bottom menu label for Background tab',
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

export default CarouselEditionBottomMenu;
