import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import BottomMenu from '#ui/BottomMenu';
import type { BottomMenuProps } from '#ui/BottomMenu';

/**
 * The bottom menu of the simple text edition screen
 */
const SimpleTextEditionBottomMenu = (
  props: Omit<BottomMenuProps, 'showLabel' | 'tabs'>,
) => {
  const intl = useIntl();

  return (
    <BottomMenu
      tabs={useMemo(
        () => [
          {
            key: 'style',
            icon: 'settings',
            label: intl.formatMessage({
              defaultMessage: 'Edit Style',
              description: 'Simple text bottom menu label for style tab',
            }),
          },
          {
            key: 'edit',
            icon: 'keyboard',
            label: intl.formatMessage({
              defaultMessage: 'Edit Text',
              description: 'Simple text bottom menu label for edit tab',
            }),
          },
          {
            key: 'margins',
            icon: 'margins',
            label: intl.formatMessage({
              defaultMessage: 'Edit Margin',
              description: 'Simple text bottom menu label for margin tab',
            }),
          },
          {
            key: 'background',
            icon: 'background',
            label: intl.formatMessage({
              defaultMessage: 'Background',
              description: 'Simple text  bottom menu label for Background tab',
            }),
          },
          {
            key: 'preview',
            icon: 'preview',
            label: intl.formatMessage({
              defaultMessage: 'Preview',
              description: 'Simple text  bottom menu label for Preview tab',
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

export default SimpleTextEditionBottomMenu;
