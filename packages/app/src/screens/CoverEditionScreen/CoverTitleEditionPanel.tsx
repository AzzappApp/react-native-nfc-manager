import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import {
  DEFAULT_COVER_CONTENT_ORTIENTATION,
  DEFAULT_COVER_CONTENT_PLACEMENT,
  DEFAULT_COVER_FONT_FAMILY,
  DEFAULT_COVER_FONT_SIZE,
  DEFAULT_COVER_MAX_FONT_SIZE,
  DEFAULT_COVER_MIN_FONT_SIZE,
  DEFAULT_COVER_TEXT_COLOR,
  TITLE_POSITIONS,
} from '@azzapp/shared/cardHelpers';
import ProfileColorPalette from '#components/ProfileColorPalette';
import DashedSlider from '#ui/DashedSlider';
import FloatingButton from '#ui/FloatingButton';
import FontPicker from '#ui/FontPicker';
import TabsBar from '#ui/TabsBar';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import { TitlePositionIcon } from './TitlePositionIcon';
import type {
  CardCoverContentStyleInput,
  CardCoverTextStyleInput,
  CardCoverTitleOrientation,
} from '@azzapp/relay/artifacts/CoverEditionScreenMutation.graphql';
import type { CoverTitleEditionPanel_viewer$key } from '@azzapp/relay/artifacts/CoverTitleEditionPanel_viewer.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type CoverTitleEditionPanelProps = {
  viewer: CoverTitleEditionPanel_viewer$key;
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
  bottomSheetHeights: number;
  style?: StyleProp<ViewStyle>;
};

const CoverTitleEditionPanel = ({
  viewer,
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
  bottomSheetHeights,
  style,
}: CoverTitleEditionPanelProps) => {
  const { profile } = useFragment(
    graphql`
      fragment CoverTitleEditionPanel_viewer on Viewer {
        profile {
          ...ProfileColorPalette_profile
        }
      }
    `,
    viewer,
  );

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
    <View style={style}>
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
          <FloatingButton
            accessibilityRole="button"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Font',
              description: 'Label of the font button in cover edition',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Tap to select a font',
              description: 'Hint of the font button in cover edition',
            })}
            style={styles.button}
            onPress={() => setFontPickerOpen(true)}
          >
            <Text
              style={{
                fontSize: 21,
                fontFamily,
              }}
            >
              abc
            </Text>
          </FloatingButton>
          <FloatingButton
            style={styles.button}
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
          </FloatingButton>

          <FloatingButton
            style={styles.button}
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
            style={styles.button}
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
          </FloatingButton>
        </View>

        <View style={styles.sliders}>
          <View style={styles.sliderContainer}>
            <Text variant="small" style={[styles.sliderTitle]}>
              <FormattedMessage
                defaultMessage="Font Size - {size}"
                description="Font size message in cover edition"
                values={{
                  size: fontSize,
                }}
              />
            </Text>
            <DashedSlider
              value={fontSize}
              min={DEFAULT_COVER_MIN_FONT_SIZE}
              max={DEFAULT_COVER_MAX_FONT_SIZE}
              step={1}
              interval={Math.floor(
                (width - 80) /
                  (DEFAULT_COVER_MAX_FONT_SIZE - DEFAULT_COVER_MIN_FONT_SIZE),
              )}
              onChange={onFontSizeChange}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Font size',
                description: 'Label of the font size slider in cover edition',
              })}
              accessibilityHint={intl.formatMessage({
                defaultMessage: 'Slide to change the font size',
                description: 'Hint of the font size slider in cover edition',
              })}
              style={{ width: '100%' }}
            />
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
      {profile && (
        <ProfileColorPalette
          profile={profile}
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
        />
      )}
    </View>
  );
};

export default CoverTitleEditionPanel;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  button: { marginRight: 15 },
  contentContainer: {
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  titleInput: {},
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    marginTop: 10,
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
