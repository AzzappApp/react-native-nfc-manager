import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { swapColor } from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import BottomMenu from '#ui/BottomMenu';
import ColorPreview from '#ui/ColorPreview';
import type { BottomMenuProps } from '#ui/BottomMenu';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';

type LineDividerEditionBottomMenuProps = Omit<
  BottomMenuProps,
  'showLabel' | 'tabs'
> & {
  colorTop: string;
  colorBottom: string;
  colorPalette?: ColorPalette | null;
};
/**
 * The bottom menu of the Line Divider edition screen
 */
const LineDividerEditionBottomMenu = ({
  colorTop,
  colorBottom,
  colorPalette,
  ...props
}: LineDividerEditionBottomMenuProps) => {
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
              description: 'Line Divider bottom menu label for settings tab',
            }),
          },
          {
            key: 'colorTop',
            IconComponent: (
              <View>
                <ColorPreview
                  color={swapColor(colorTop, colorPalette)}
                  style={styles.colorPreview}
                  colorSize={16}
                />
              </View>
            ),
            label: intl.formatMessage({
              defaultMessage: 'Edit Top Color',
              description: 'Line Divider bottom menu label for top color tab',
            }),
          },
          {
            key: 'margins',
            icon: 'height',
            label: intl.formatMessage({
              defaultMessage: 'Edit Margin',
              description: 'Line Divider bottom menu label for margin tab',
            }),
          },
          {
            key: 'colorBottom',
            IconComponent: (
              <View>
                <ColorPreview
                  color={swapColor(colorBottom, colorPalette)}
                  style={styles.colorPreview}
                  colorSize={16}
                />
              </View>
            ),
            label: intl.formatMessage({
              defaultMessage: 'Edit Bottom Color',
              description:
                'Line Divider bottom menu label for bottom color tab',
            }),
          },
        ],
        [colorBottom, colorTop, intl, colorPalette],
      )}
      showLabel={false}
      {...props}
    />
  );
};

export default LineDividerEditionBottomMenu;

const styles = StyleSheet.create({
  colorPreview: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.grey200,
    marginLeft: 1,
  },
});
