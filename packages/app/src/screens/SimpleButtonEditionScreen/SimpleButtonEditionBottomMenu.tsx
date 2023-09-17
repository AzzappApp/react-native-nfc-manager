import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import BottomMenu from '#ui/BottomMenu';
import type { BottomMenuProps } from '#ui/BottomMenu';

type SimpleButtonEditionBottomMenuProps = Omit<
  BottomMenuProps,
  'showLabel' | 'tabs'
>;
/**
 * The bottom menu of the SimpleButton edition screen
 */
const SimpleButtonEditionBottomMenu = (
  props: SimpleButtonEditionBottomMenuProps,
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
              defaultMessage: 'Edit Settings',
              description: 'SimpleButton bottom menu label for Settings tab',
            }),
          },
          {
            key: 'borders',
            icon: 'border',
            label: intl.formatMessage({
              defaultMessage: 'Edit Borders',
              description: 'SimpleButton bottom menu label for Borders tab',
            }),
          },
          {
            key: 'margins',
            icon: 'margins',
            label: intl.formatMessage({
              defaultMessage: 'Edit Margins',
              description: 'SimpleButton bottom menu label for Margins tab',
            }),
          },
          {
            key: 'background',
            icon: 'background',
            label: intl.formatMessage({
              defaultMessage: 'Edit Background',
              description: 'SimpleButton bottom menu label for Background tab',
            }),
          },
          {
            key: 'preview',
            icon: 'preview',
            label: intl.formatMessage({
              defaultMessage: 'Preview',
              description: 'SimpleButton bottom menu label for Preview tab',
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

export default SimpleButtonEditionBottomMenu;
