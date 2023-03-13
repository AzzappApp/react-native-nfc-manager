import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  DEFAULT_COVER_CONTENT_ORTIENTATION,
  DEFAULT_COVER_CONTENT_PLACEMENT,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
  TITLE_POSITIONS,
} from '@azzapp/shared/cardHelpers';
import { colors, fontFamilies, textStyles } from '#theme';
import { ProfileColorPaletteModal } from '#components/ProfileColorPalette';
import DashedSlider from '#ui/DashedSlider';
import FontPicker from '#ui/FontPicker';
import TabsBar, { TAB_BAR_HEIGHT } from '#ui/TabsBar';
import { TitlePositionIcon } from './TitlePositionIcon';
import type {
  CardCoverContentStyleInput,
  CardCoverTextStyleInput,
  CardCoverTitleOrientation,
} from '@azzapp/relay/artifacts/CoverEditionScreenMutation.graphql';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';

type CoverTitleEditionPanelProps = {
  title: string | null | undefined;
  titleStyle: CardCoverTextStyleInput | null | undefined;
  subTitle: string | null | undefined;
  subTitleStyle: CardCoverTextStyleInput | null | undefined;
  contentStyle: CardCoverContentStyleInput | null | undefined;
  onTitleChange: (title: string) => void;
  onTitleStyleChange: (titleStyle: CardCoverTextStyleInput) => void;
  onSubTitleChange: (subTitle: string) => void;
  onSubTitleStyleChange: (subTitleStyle: CardCoverTextStyleInput) => void;
  onContentStyleChange: (contentStyle: CardCoverContentStyleInput) => void;
  style?: StyleProp<ViewStyle>;
};

const CoverTitleEditionPanel = ({
  title,
  titleStyle,
  subTitle,
  subTitleStyle,
  contentStyle,
  onTitleChange,
  onTitleStyleChange,
  onSubTitleChange,
  onSubTitleStyleChange,
  onContentStyleChange,
  style,
}: CoverTitleEditionPanelProps) => {
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

  const { orientation, placement } = useMemo(
    () => ({
      orientation:
        contentStyle?.orientation ?? DEFAULT_COVER_CONTENT_ORTIENTATION,
      placement: contentStyle?.placement ?? DEFAULT_COVER_CONTENT_PLACEMENT,
    }),
    [contentStyle],
  );

  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  // const [titlePositonPickerOpen, setTitlePositonPickerOpen] = useState(false);
  const [bottomSheetHeights, setBottomSheetHeights] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setBottomSheetHeights(
      event.nativeEvent.layout.height + TAB_BAR_HEIGHT + 20,
    );
  };

  const onFontFamilyChange = (fontFamily: string) => {
    if (currentTab === 'title') {
      onTitleStyleChange({ ...titleStyle, fontFamily });
      if (!subTitleStyle?.fontFamily) {
        onSubTitleStyleChange({ ...subTitleStyle, fontFamily });
      }
    } else {
      onSubTitleStyleChange({ ...subTitleStyle, fontFamily });
    }
  };

  const onFontSizeChange = (fontSize: number) => {
    if (currentTab === 'title') {
      onTitleStyleChange({ ...titleStyle, fontSize });
      if (!subTitleStyle?.fontSize) {
        onSubTitleStyleChange({ ...subTitleStyle, fontSize });
      }
    } else {
      onSubTitleStyleChange({ ...subTitleStyle, fontSize });
    }
  };

  const onColorChange = (color: string) => {
    if (currentTab === 'title') {
      onTitleStyleChange({ ...titleStyle, color });
      if (!subTitleStyle?.color) {
        onSubTitleStyleChange({ ...subTitleStyle, color });
      }
    } else {
      onSubTitleStyleChange({ ...subTitleStyle, color });
    }
  };

  const onNextPlacement = () => {
    const index =
      (TITLE_POSITIONS.indexOf(placement) + 1) % TITLE_POSITIONS.length;
    onContentStyleChange({
      ...contentStyle,
      placement: TITLE_POSITIONS[index],
    });
  };

  const onNextOrientation = () => {
    const nextOrientation =
      orientation === 'bottomToTop'
        ? 'topToBottom'
        : orientation === 'topToBottom'
        ? 'horizontal'
        : 'bottomToTop';

    onContentStyleChange({
      ...contentStyle,
      orientation: nextOrientation,
    });
  };

  const intl = useIntl();

  const placementsLabels = usePlacementsLabels();
  const orientationsLabel = useOrientationsLabels();

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      <TabsBar
        currentTab={currentTab}
        onTabPress={onTabPress}
        variant="topbar"
        tabs={[
          {
            key: 'title',
            label: intl.formatMessage({
              defaultMessage: 'Title',
              description: 'Label of the title tab in cover edition',
            }),
          },
          {
            key: 'subtitle',
            label: intl.formatMessage({
              defaultMessage: 'Subtitle',
              description: 'Label of the subtitle tab in cover edition',
            }),
          },
        ]}
      />
      <View style={[style, styles.contentContainer]}>
        <TextInput
          value={(currentTab === 'subtitle' ? subTitle : title) ?? ''}
          onChangeText={
            currentTab === 'subtitle' ? onSubTitleChange : onTitleChange
          }
          style={styles.titleInput}
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
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { marginRight: 10 },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setFontPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Font',
              description: 'Label of the font button in cover edition',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Tap to select a font',
              description: 'Hint of the font button in cover edition',
            })}
          >
            <Text
              style={{
                fontSize: 21,
                fontFamily,
              }}
            >
              abc
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { marginRight: 10 },
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setColorPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Color',
              description: 'Label of the color button in cover edition',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Tap to select a color',
              description: 'Hint of the color button in cover edition',
            })}
          >
            <Text
              style={{
                ...fontFamilies.semiBold,
                fontSize: 24,
                color,
              }}
            >
              A
            </Text>
            <View
              style={{
                width: 25,
                height: 3,
                borderRadius: 4,
                backgroundColor: color,
              }}
            />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { marginRight: 10 },
              pressed && styles.buttonPressed,
            ]}
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
              text: placementsLabels[placement],
            }}
          >
            <TitlePositionIcon value={placement} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
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
          </Pressable>
        </View>
        <View style={styles.sliders}>
          <View style={styles.sliderContainer}>
            <DashedSlider
              value={fontSize}
              min={10}
              max={24}
              step={1}
              interval={10}
              onChange={onFontSizeChange}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Font size',
                description: 'Label of the font size slider in cover edition',
              })}
              accessibilityHint={intl.formatMessage({
                defaultMessage: 'Slide to change the font size',
                description: 'Hint of the font size slider in cover edition',
              })}
            />
            <Text style={[textStyles.small, styles.sliderTitle]}>
              <FormattedMessage
                defaultMessage="FONT SIZE {size}"
                description="Font size message in cover edition"
                values={{
                  size: fontSize,
                }}
              />
            </Text>
          </View>
        </View>
      </View>
      <FontPicker
        title={intl.formatMessage({
          defaultMessage: 'Font family',
          description: 'Title of the font picker modal in cover edition',
        })}
        value={fontFamily as any}
        visible={fontPickerOpen}
        onRequestClose={() => setFontPickerOpen(false)}
        onChange={onFontFamilyChange}
        height={bottomSheetHeights}
      />
      <ProfileColorPaletteModal
        title={intl.formatMessage({
          defaultMessage: 'Font color',
          description:
            'Title of the color picker modal in cover edition for font color',
        })}
        selectedColor={color}
        visible={colorPickerOpen}
        onRequestClose={() => setColorPickerOpen(false)}
        onChangeColor={onColorChange}
        height={bottomSheetHeights}
        validationButtonLabel={intl.formatMessage({
          defaultMessage: 'Save',
          description:
            'CoverTitleEditionPanel - Label of the save button in font color picker modal',
        })}
      />
    </View>
  );
};

export default CoverTitleEditionPanel;

const styles = StyleSheet.create({
  root: {
    paddingTop: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  titleInput: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: colors.grey50,
    borderRadius: 15,
    ...fontFamilies.semiBold,
  },
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.darkGrey,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.grey,
  },
  sliders: {
    marginTop: 10,
    flexDirection: 'row',
  },
  sliderContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  sliderTitle: {
    marginTop: 4,
    alignSelf: 'center',
  },
  titlePositionIcon: {
    width: 24,
    resizeMode: 'contain',
  },
  orientationIcon: {
    width: 30,
    height: 30,
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

const useOrientationsLabels = (): Record<CardCoverTitleOrientation, string> => {
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
    '%future added value': '',
  };
};
