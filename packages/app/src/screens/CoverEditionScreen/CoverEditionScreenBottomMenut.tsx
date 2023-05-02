import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import BottomMenu from '#ui/BottomMenu';
import type { BottomMenuProps } from '#ui/BottomMenu';

const CoverEditionBottomMenu = (
  props: Omit<BottomMenuProps, 'showLabel' | 'tabs'>,
) => {
  const intl = useIntl();

  return (
    <BottomMenu
      tabs={useMemo(
        () => [
          {
            key: 'models',
            icon: 'templates',
            label: intl.formatMessage({
              defaultMessage: 'Models',
              description:
                'CoverEditionScreen bottom menu label for models tab',
            }),
          },
          {
            key: 'image',
            icon: 'image',
            label: intl.formatMessage({
              defaultMessage: 'Image',
              description: 'CoverEditionScreen bottom menu label for Image tab',
            }),
          },
          {
            key: 'title',
            icon: 'text',
            label: intl.formatMessage({
              defaultMessage: 'Text',
              description: 'CoverEditionScreen bottom menu label for Text tab',
            }),
          },
          {
            key: 'foreground',
            icon: 'foreground',
            label: intl.formatMessage({
              defaultMessage: 'Fore.',
              description:
                'CoverEditionScreen bottom menu label for Foreground tab',
            }),
          },
          {
            key: 'background',
            icon: 'background',
            label: intl.formatMessage({
              defaultMessage: 'Back.',
              description:
                'CoverEditionScreen bottom menu label for Background tab',
            }),
          },
        ],
        [intl],
      )}
      showLabel
      {...props}
    />
  );
};

export default CoverEditionBottomMenu;
