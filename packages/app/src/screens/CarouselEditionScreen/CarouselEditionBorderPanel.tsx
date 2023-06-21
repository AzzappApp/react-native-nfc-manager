import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import ProfileColorPicker from '#components/ProfileColorPicker';
import ColorPreview from '#ui/ColorPreview';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TabsBar from '#ui/TabsBar';
import type { ProfileColorPicker_profile$key } from '@azzapp/relay/artifacts/ProfileColorPicker_profile.graphql';
import type { ViewProps } from 'react-native';

type CarouselEditionBorderPanelProps = Omit<ViewProps, 'children'> & {
  /**
   * The size of the border.
   */
  borderSize: number;
  /**
   * The color of the border.
   */
  borderColor: string;
  /**
   * The radius of the border.
   */
  borderRadius: number;
  /**
   * The height of the bottom sheet.
   */
  bottomSheetHeight: number;
  /**
   * The current profile. used for the color picker.
   */
  profile: ProfileColorPicker_profile$key;
  /**
   * Called when the user wants to change the border size.
   */
  onBorderSizeChange: (borderSize: number) => void;
  /**
   * Called when the user wants to change the border color.
   */
  onBorderColorChange: (borderColor: string) => void;
  /**
   * Called when the user wants to change the border radius.
   */
  onBorderRadiusChange: (borderRadius: number) => void;
};

/**
 * A panel to edit the border of the carousel.
 */
const CarouselEditionBorderPanel = ({
  profile,
  borderSize,
  borderColor,
  borderRadius,
  bottomSheetHeight,
  onBorderSizeChange,
  onBorderColorChange,
  onBorderRadiusChange,
  style,
  ...props
}: CarouselEditionBorderPanelProps) => {
  const [currentTab, setCurrentTab] = useState<string>('size');

  const onProfileColorPickerClose = useCallback(() => {
    setCurrentTab('size');
  }, [setCurrentTab]);

  const intl = useIntl();

  const tabs = useMemo(
    () => [
      {
        tabKey: 'size',
        label: intl.formatMessage({
          defaultMessage: 'Border shape',
          description: 'Title of the border shape section in carousel edition',
        }),
      },
      {
        tabKey: 'color',
        label: intl.formatMessage({
          defaultMessage: 'Border color',
          description: 'Title of the border color section in carousel edition',
        }),
        rightElement: (
          <ColorPreview color={borderColor} style={{ marginLeft: 5 }} />
        ),
      },
    ],
    [borderColor, intl],
  );

  return (
    <View {...props} style={[styles.root, style]}>
      <TabsBar currentTab={currentTab} onTabPress={setCurrentTab} tabs={tabs} />
      <View style={styles.content}>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border size : {size}"
              description="Border size message in carousel edition"
              values={{ size: borderSize }}
            />
          }
          value={borderSize}
          min={0}
          max={50}
          step={1}
          onChange={onBorderSizeChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Border size',
            description: 'Label of the border size in carousel edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the border size',
            description: 'Hint of the border size slider in carousel edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border radius : {radius}"
              description="Border radius in carousel edition"
              values={{ radius: borderRadius }}
            />
          }
          value={borderRadius}
          min={0}
          max={200}
          step={1}
          onChange={onBorderRadiusChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Border radius',
            description: 'Label of the border radius in carousel edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the border radius',
            description: 'Hint of the border radius slider in carousel edition',
          })}
          style={styles.slider}
        />
      </View>
      {profile && (
        <ProfileColorPicker
          visible={currentTab !== 'size'}
          height={bottomSheetHeight}
          profile={profile}
          title={intl.formatMessage({
            defaultMessage: 'Border color',
            description: 'Title of the border color picker in carousel edition',
          })}
          selectedColor={borderColor}
          onColorChange={onBorderColorChange}
          onRequestClose={onProfileColorPickerClose}
        />
      )}
    </View>
  );
};

export default CarouselEditionBorderPanel;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  content: {
    marginTop: 20,
    flex: 1,
    justifyContent: 'center',
    rowGap: 15,
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
