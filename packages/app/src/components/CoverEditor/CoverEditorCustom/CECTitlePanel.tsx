import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, StyleSheet, View } from 'react-native';
import {
  DEFAULT_COVER_CONTENT_ORTIENTATION,
  DEFAULT_COVER_CONTENT_POSITION,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_MAX_FONT_SIZE,
  DEFAULT_COVER_MIN_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
  TEXT_POSITIONS,
} from '@azzapp/shared/coverHelpers';
import { ColorDropDownPicker } from '#ui/ColorDropDownPicker';
import FloatingButton from '#ui/FloatingButton';
import FontDropDownPicker from '#ui/FontDropDownPicker';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TabsBar from '#ui/TabsBar';
import TextInput from '#ui/TextInput';
import { TitlePositionIcon } from './TitlePositionIcon';
import type { ColorPalette } from '../coverEditorTypes';
import type {
  TextOrientation,
  TextPosition,
  TextStyle,
} from '@azzapp/shared/coverHelpers';
import type { StyleProp, ViewStyle } from 'react-native';

type CECTitlePanelProps = {
  title: string | null | undefined;
  titleStyle: TextStyle | null | undefined;
  subTitle: string | null | undefined;
  subTitleStyle: TextStyle | null | undefined;
  textOrientation: TextOrientation | null | undefined;
  textPosition: TextPosition | null | undefined;
  colorPalette: ColorPalette;
  otherColors: string[];
  onTitleChange: (title: string) => void;
  onTitleStyleChange: (titleStyle: TextStyle) => void;
  onSubTitleChange: (subTitle: string) => void;
  onSubTitleStyleChange: (subTitleStyle: TextStyle) => void;
  onTextOrientationChange: (orientation: TextOrientation) => void;
  onTextPositionChange: (position: TextPosition) => void;
  /**
   * Called when the user update the color palette
   */
  onUpdateColorPalette: (colorPalette: ColorPalette) => void;
  /**
   * Called when the user update the color list
   */
  onUpdateColorList: (color: string[]) => void;
  bottomSheetHeights: number;
  style?: StyleProp<ViewStyle>;
};

const CECTitlePanel = ({
  title,
  titleStyle,
  subTitle,
  subTitleStyle,
  textOrientation,
  textPosition,
  colorPalette,
  otherColors,
  onTitleChange,
  onTitleStyleChange,
  onSubTitleChange,
  onSubTitleStyleChange,
  onTextOrientationChange,
  onTextPositionChange,
  onUpdateColorPalette,
  onUpdateColorList,
  bottomSheetHeights,
  style,
}: CECTitlePanelProps) => {
  const [currentTab, setCurrentTab] = useState<'subtitle' | 'title'>('title');

  const onTabPress = (tab: string) => {
    setCurrentTab(tab as 'subtitle' | 'title');
  };

  const { fontFamily, fontSize, color } = useMemo(() => {
    const textStyles = currentTab === 'title' ? titleStyle : subTitleStyle;
    return {
      fontFamily: textStyles?.fontFamily ?? DEFAULT_COVER_FONT_FAMILY,
      fontSize: textStyles?.fontSize ?? DEFAULT_COVER_FONT_SIZE,
      color: textStyles?.color ?? DEFAULT_COVER_TEXT_COLOR,
    };
  }, [currentTab, subTitleStyle, titleStyle]);

  const orientation = textOrientation ?? DEFAULT_COVER_CONTENT_ORTIENTATION;
  const position = textPosition ?? DEFAULT_COVER_CONTENT_POSITION;

  const onFontFamilyChange = (fontFamily: string) => {
    if (currentTab === 'title') {
      onTitleStyleChange({ fontFamily, fontSize, color });
      if (!subTitleStyle?.fontFamily) {
        onSubTitleStyleChange({ fontFamily, fontSize, color });
      }
    } else {
      onSubTitleStyleChange({ fontFamily, fontSize, color });
    }
  };

  const onFontSizeChange = (fontSize: number) => {
    if (currentTab === 'title') {
      onTitleStyleChange({ fontFamily, fontSize, color });
      if (!subTitleStyle?.fontSize) {
        onSubTitleStyleChange({ fontFamily, fontSize, color });
      }
    } else {
      onSubTitleStyleChange({ fontFamily, fontSize, color });
    }
  };

  const onColorChange = (color: string) => {
    if (currentTab === 'title') {
      onTitleStyleChange({ fontFamily, fontSize, color });
      if (!subTitleStyle?.color) {
        onSubTitleStyleChange({ fontFamily, fontSize, color });
      }
    } else {
      onSubTitleStyleChange({ fontFamily, fontSize, color });
    }
  };

  const onNextPlacement = () => {
    const index =
      (TEXT_POSITIONS.indexOf(position as any) + 1) % TEXT_POSITIONS.length;
    onTextPositionChange(TEXT_POSITIONS[index]);
  };

  const onNextOrientation = () => {
    onTextOrientationChange(
      orientation === 'bottomToTop'
        ? 'topToBottom'
        : orientation === 'topToBottom'
        ? 'horizontal'
        : 'bottomToTop',
    );
  };

  const intl = useIntl();

  const placementsLabels = usePlacementsLabels();
  const orientationsLabel = useOrientationsLabels();

  return (
    <View style={[styles.root, style]}>
      <TabsBar
        currentTab={currentTab}
        onTabPress={onTabPress}
        decoration="underline"
        tabs={[
          {
            tabKey: 'title',
            label: intl.formatMessage({
              defaultMessage: 'Name',
              description: 'Label of the name tab in cover edition',
            }),
          },
          {
            tabKey: 'subtitle',
            label: intl.formatMessage({
              defaultMessage: 'Subtitle',
              description: 'Label of the subtitle tab in cover edition',
            }),
          },
        ]}
      />
      <View style={styles.contentContainer}>
        <TextInput
          value={(currentTab === 'subtitle' ? subTitle : title) ?? ''}
          onChangeText={
            currentTab === 'subtitle' ? onSubTitleChange : onTitleChange
          }
          placeholder={
            currentTab === 'title'
              ? intl.formatMessage({
                  defaultMessage: 'Title',
                  description: 'Label of the title input in cover edition',
                })
              : intl.formatMessage({
                  defaultMessage: 'Subtitle',
                  description: 'Label of the subtitle input in cover edition',
                })
          }
        />
        <View style={styles.buttonContainer}>
          <FontDropDownPicker
            fontFamily={fontFamily}
            onFontFamilyChange={onFontFamilyChange}
            bottomSheetHeight={bottomSheetHeights}
          />
          <ColorDropDownPicker
            color={color}
            onColorChange={onColorChange}
            bottomSheetHeight={bottomSheetHeights}
            colorPalette={colorPalette}
            colorList={otherColors}
            onUpdateColorList={onUpdateColorList}
            onUpdateColorPalette={onUpdateColorPalette}
          />

          <FloatingButton
            onPress={onNextOrientation}
            accessibilityRole="button"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Orientation',
              description: 'Label of the orientation button in cover edition',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Tap to change the orientation of the content',
              description: 'Hint of the orientation button in cover edition',
            })}
            accessibilityValue={{
              text: orientationsLabel[orientation] ?? '',
            }}
          >
            <Image
              source={
                orientation === 'bottomToTop'
                  ? require('./assets/bottom-to-top.png')
                  : orientation === 'topToBottom'
                  ? require('./assets/top-to-bottom.png')
                  : require('./assets/horizontal.png')
              }
              style={styles.orientationIcon}
            />
          </FloatingButton>
          <FloatingButton
            onPress={onNextPlacement}
            accessibilityRole="button"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Position',
              description: 'Label of the position button in cover edition',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Tap to change the position',
              description: 'Hint of the position button in cover edition',
            })}
            accessibilityValue={{
              text: placementsLabels[position],
            }}
          >
            <TitlePositionIcon value={position} />
          </FloatingButton>
        </View>

        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Font size : {fontSize}"
              description="Font size message in cover edition"
              values={{ fontSize }}
            />
          }
          value={fontSize}
          min={DEFAULT_COVER_MIN_FONT_SIZE}
          max={DEFAULT_COVER_MAX_FONT_SIZE}
          step={1}
          onChange={onFontSizeChange}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Font size',
            description: 'Label of the font size slider in cover edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change the font size',
            description: 'Hint of the font size slider in cover edition',
          })}
          style={styles.slider}
        />
      </View>
    </View>
  );
};

export default CECTitlePanel;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: 15,
  },
  orientationIcon: {
    width: 30,
    height: 30,
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
  },
});

const usePlacementsLabels = (): Record<string, string> => {
  const intl = useIntl();
  return {
    topLeft: intl.formatMessage({
      defaultMessage: 'Top left',
      description: 'Label of the top left position in cover edition',
    }),
    topCenter: intl.formatMessage({
      defaultMessage: 'Top center',
      description: 'Label of the top center position in cover edition',
    }),
    topRight: intl.formatMessage({
      defaultMessage: 'Top right',
      description: 'Label of the top right position in cover edition',
    }),
    middleLeft: intl.formatMessage({
      defaultMessage: 'Middle left',
      description: 'Label of the middle left position in cover edition',
    }),
    middleCenter: intl.formatMessage({
      defaultMessage: 'Middle center',
      description: 'Label of the middle center position in cover edition',
    }),
    middleRight: intl.formatMessage({
      defaultMessage: 'Middle right',
      description: 'Label of the middle right position in cover edition',
    }),
    bottomLeft: intl.formatMessage({
      defaultMessage: 'Bottom left',
      description: 'Label of the bottom left position in cover edition',
    }),
    bottomCenter: intl.formatMessage({
      defaultMessage: 'Bottom center',
      description: 'Label of the bottom center position in cover edition',
    }),
    bottomRight: intl.formatMessage({
      defaultMessage: 'Bottom right',
      description: 'Label of the bottom right position in cover edition',
    }),
  };
};

const useOrientationsLabels = (): Record<TextOrientation, string> => {
  const intl = useIntl();
  return {
    bottomToTop: intl.formatMessage({
      defaultMessage: 'Bottom to top',
      description: 'Label of the bottom to top orientation in cover edition',
    }),
    topToBottom: intl.formatMessage({
      defaultMessage: 'Top to bottom',
      description: 'Label of the top to bottom orientation in cover edition',
    }),
    horizontal: intl.formatMessage({
      defaultMessage: 'Horizontal',
      description: 'Label of the horizontal orientation in cover edition',
    }),
  };
};
