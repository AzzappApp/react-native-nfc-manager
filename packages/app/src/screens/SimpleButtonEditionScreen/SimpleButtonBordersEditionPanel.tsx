import { useState, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';

import { useFragment, graphql } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import ProfileColorPicker from '#components/ProfileColorPicker';
import ColorPreview from '#ui/ColorPreview';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TabsBar from '#ui/TabsBar';
import type { SimpleButtonBordersEditionPanel_viewer$key } from '@azzapp/relay/artifacts/SimpleButtonBordersEditionPanel_viewer.graphql';
import type { ViewProps } from 'react-native';

type SimpleButtonBordersEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the viewer
   */
  viewer: SimpleButtonBordersEditionPanel_viewer$key;
  /**
   * The borderColor currently set on the module
   */
  borderColor: string;
  /**
   * A callback called when the user update the borderColor
   */
  onBordercolorChange: (borderColor: string) => void;
  /**
   * The borderWidth currently set on the module
   */
  borderWidth: number;
  /**
   * A callback called when the user update the borderWidth
   */
  onBorderwidthChange: (borderWidth: number) => void;
  /**
   * The borderRadius currently set on the module
   */
  borderRadius: number;
  /**
   * A callback called when the user update the borderRadius
   */
  onBorderradiusChange: (borderRadius: number) => void;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;
};

/**
 * A Panel to edit the Borders of the SimpleButton edition screen
 */
const SimpleButtonBordersEditionPanel = ({
  viewer,
  borderColor,
  onBordercolorChange,
  borderWidth,
  onBorderwidthChange,
  borderRadius,
  onBorderradiusChange,
  style,
  bottomSheetHeight,
  ...props
}: SimpleButtonBordersEditionPanelProps) => {
  const intl = useIntl();

  const [currentTab, setCurrentTab] = useState<string>('borders');
  const { profile } = useFragment(
    graphql`
      fragment SimpleButtonBordersEditionPanel_viewer on Viewer {
        profile {
          ...ProfileColorPicker_profile
        }
      }
    `,
    viewer,
  );

  const onProfileColorPickerClose = useCallback(() => {
    setCurrentTab('borders');
  }, [setCurrentTab]);

  const tabs = useMemo(
    () =>
      convertToNonNullArray([
        {
          tabKey: 'borders',
          label: intl.formatMessage({
            defaultMessage: 'Border shape',
            description: 'Border Shape tab label in SimpleButton edition',
          }),
        },
        {
          tabKey: 'color',
          label: intl.formatMessage({
            defaultMessage: 'Border color',
            description: 'Border color tab label in SimpleButton edition',
          }),
          rightElement: (
            <ColorPreview color={borderColor} style={{ marginLeft: 5 }} />
          ),
        },
      ]),
    [borderColor, intl],
  );

  return (
    <View style={[styles.root, style]} {...props}>
      <TabsBar currentTab={currentTab} onTabPress={setCurrentTab} tabs={tabs} />
      <View style={styles.paramContainer}>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border size : {size}"
              description="borderWidth message in SimpleButton edition"
              values={{
                size: borderWidth,
              }}
            />
          }
          value={borderWidth}
          min={0}
          max={10}
          step={1}
          onChange={onBorderwidthChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Border width',
            description:
              'Label of the border Width slider in SimpleButton edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the border Width',
            description:
              'Hint of the border Width slider in SimpleButton edition',
          })}
          style={styles.slider}
        />

        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border radius : {size}"
              description="border radius message in SimpleButton edition"
              values={{
                size: borderRadius,
              }}
            />
          }
          value={borderRadius}
          min={0}
          max={100}
          step={1}
          onChange={onBorderradiusChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Border Radius',
            description:
              'Label of the borderRadius slider in SimpleButton edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the border Radius',
            description:
              'Hint of the borderRadius slider in SimpleButton edition',
          })}
          style={styles.slider}
        />
      </View>
      {profile && (
        <ProfileColorPicker
          visible={currentTab !== 'borders'}
          height={bottomSheetHeight}
          profile={profile}
          title={intl.formatMessage({
            defaultMessage: 'Border color',
            description: 'Bordercolor color title in SimpleButton edition',
          })}
          selectedColor={borderColor}
          onColorChange={onBordercolorChange}
          onRequestClose={onProfileColorPickerClose}
        />
      )}
    </View>
  );
};

export default SimpleButtonBordersEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
  paramContainer: {
    width: '100%',
    flex: 1,
    rowGap: 25,
    justifyContent: 'center',
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
