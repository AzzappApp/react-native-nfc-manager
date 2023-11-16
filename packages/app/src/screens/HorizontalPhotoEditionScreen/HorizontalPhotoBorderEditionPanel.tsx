import { useState, useMemo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  HORIZONTAL_PHOTO_MAX_BORDER_RADIUS,
  HORIZONTAL_PHOTO_MAX_BORDER_WIDTH,
} from '@azzapp/shared/cardModuleHelpers';
import ProfileColorPicker from '#components/ProfileColorPicker';
import ColorPreview from '#ui/ColorPreview';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TabsBar from '#ui/TabsBar';
import type { HorizontalPhotoBorderEditionPanel_viewer$key } from '@azzapp/relay/artifacts/HorizontalPhotoBorderEditionPanel_viewer.graphql';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

type HorizontalPhotoBorderEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the viewer
   */
  viewer: HorizontalPhotoBorderEditionPanel_viewer$key;
  /**
   * The borderWidth currently set on the module
   */
  borderWidth: number;
  /**
   * A callback called when the user update the borderWidth
   */
  onBorderWidthChange: (borderWidth: number) => void;

  /**
   * The borderRadius currently set on the module
   */
  borderRadius: number;
  /**
   * A callback called when the user update the borderRadius
   */
  onBorderRadiusChange: (borderRadius: number) => void;

  /**
   * The borderColor currently set on the module
   */
  borderColor: string;
  /**
   * A callback called when the user update the borderColor
   */
  onBorderColorChange: (borderColor: string) => void;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;
};

/**
 * Panel to edit the style of the HorizontalPhoto
 */
const HorizontalPhotoBorderEditionPanel = ({
  borderWidth,
  onBorderWidthChange,
  borderRadius,
  onBorderRadiusChange,
  borderColor,
  onBorderColorChange,
  viewer,
  bottomSheetHeight,
  style,
  ...props
}: HorizontalPhotoBorderEditionPanelProps) => {
  const intl = useIntl();

  const [currentTab, setCurrentTab] = useState<string>('border');
  const { profile } = useFragment(
    graphql`
      fragment HorizontalPhotoBorderEditionPanel_viewer on Viewer {
        profile {
          ...ProfileColorPicker_profile
        }
      }
    `,
    viewer,
  );

  const onProfileColorPickerClose = useCallback(() => {
    setCurrentTab('border');
  }, [setCurrentTab]);

  const tabs = useMemo(
    () =>
      convertToNonNullArray([
        {
          tabKey: 'border',
          label: intl.formatMessage({
            defaultMessage: 'Border shape',
            description: 'Border shape tab label in HorizontalPhoto edition',
          }),
        },
        {
          tabKey: 'color',
          label: intl.formatMessage({
            defaultMessage: 'Border color',
            description: 'Border color tab label in HorizontalPhoto edition',
          }),
          rightElement: (
            <ColorPreview color={borderColor} style={{ marginLeft: 5 }} />
          ),
        },
      ]),
    [borderColor, intl],
  );

  return (
    <View {...props} style={[styles.root, style]}>
      <TabsBar currentTab={currentTab} onTabPress={setCurrentTab} tabs={tabs} />
      <View style={styles.paramContainer}>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border size:"
              description="Border size message in Horizontal Photo edition"
            />
          }
          initialValue={borderWidth}
          min={0}
          max={HORIZONTAL_PHOTO_MAX_BORDER_WIDTH}
          step={1}
          onChange={onBorderWidthChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Border size',
            description:
              'Label of the Border size slider in HorizontalPhoto edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the Border size',
            description:
              'Hint of the Border size slider in HorizontalPhoto edition',
          })}
          style={styles.slider}
        />
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Border radius:"
              description="Border radius message in Horizontal Photo edition"
            />
          }
          initialValue={borderRadius}
          min={0}
          max={HORIZONTAL_PHOTO_MAX_BORDER_RADIUS}
          step={1}
          onChange={onBorderRadiusChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Image border radius size',
            description:
              'Label of the Border radius size slider in HorizontalPhoto edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the image border radius size',
            description:
              'Hint of the Border radius slider in HorizontalPhoto edition',
          })}
          style={styles.slider}
        />
        {profile && (
          <ProfileColorPicker
            visible={currentTab !== 'border'}
            height={bottomSheetHeight}
            profile={profile}
            title={intl.formatMessage({
              defaultMessage: 'Border color',
              description: 'Border color title in HorizontalPhoto edition',
            })}
            selectedColor={borderColor}
            onColorChange={onBorderColorChange}
            onRequestClose={onProfileColorPickerClose}
          />
        )}
      </View>
    </View>
  );
};

export default HorizontalPhotoBorderEditionPanel;

const styles = StyleSheet.create({
  paramContainer: { flex: 1, justifyContent: 'center', rowGap: 25 },
  root: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    rowGap: 15,
    justifyContent: 'flex-start',
  },
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: 15,
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});
