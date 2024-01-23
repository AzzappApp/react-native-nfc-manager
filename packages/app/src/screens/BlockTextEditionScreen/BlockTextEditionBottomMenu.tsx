import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import BottomMenu from '#ui/BottomMenu';
import type { BottomMenuProps } from '#ui/BottomMenu';

type BlockTextEditionBottomMenuProps = Omit<
  BottomMenuProps,
  'showLabel' | 'tabs'
>;
/**
 * The bottom menu of the BlockText edition screen
 */
const BlockTextEditionBottomMenu = (props: BlockTextEditionBottomMenuProps) => {
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
              description: 'BlockText bottom menu label for Settings tab',
            }),
          },
          {
            key: 'editor',
            icon: 'keyboard',
            label: intl.formatMessage({
              defaultMessage: 'Edit editor',
              description: 'BlockText bottom menu label for editor tab',
            }),
          },
          {
            key: 'margins',
            icon: 'margins',
            label: intl.formatMessage({
              defaultMessage: 'Edit Margins',
              description: 'BlockText bottom menu label for Margins tab',
            }),
          },
          {
            key: 'textBackground',
            icon: 'background',
            label: intl.formatMessage({
              defaultMessage: 'Edit TextBackground',
              description: 'BlockText bottom menu label for TextBackground tab',
            }),
          },
          {
            key: 'sectionBackground',
            icon: 'background',
            label: intl.formatMessage({
              defaultMessage: 'Edit SectionBackground',
              description:
                'BlockText bottom menu label for SectionBackground tab',
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

export default BlockTextEditionBottomMenu;
