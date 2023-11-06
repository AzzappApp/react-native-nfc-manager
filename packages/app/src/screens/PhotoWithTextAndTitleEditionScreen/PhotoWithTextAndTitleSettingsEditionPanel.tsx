import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import {
  PHOTO_WITH_TEXT_AND_TITLE_MAX_FONT_SIZE,
  PHOTO_WITH_TEXT_AND_TITLE_MAX_TITLE_FONT_SIZE,
  PHOTO_WITH_TEXT_AND_TITLE_MAX_VERTICAL_SPACING,
  PHOTO_WITH_TEXT_AND_TITLE_MIN_FONT_SIZE,
  PHOTO_WITH_TEXT_AND_TITLE_MIN_TITLE_FONT_SIZE,
} from '@azzapp/shared/cardModuleHelpers';
import { WebCardColorDropDownPicker } from '#components/WebCardColorPicker';
import AlignmentButton from '#ui/AlignmentButton';
import FontDropDownPicker from '#ui/FontDropDownPicker';
import LabeledDashedSlider from '#ui/LabeledDashedSlider';
import TabsBar from '#ui/TabsBar';
import type { TextAlignment } from '@azzapp/relay/artifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type { PhotoWithTextAndTitleSettingsEditionPanel_webCard$key } from '@azzapp/relay/artifacts/PhotoWithTextAndTitleSettingsEditionPanel_webCard.graphql';
import type { ViewProps } from 'react-native';

type PhotoWithTextAndTitleSettingsEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the webCard
   */
  webCard: PhotoWithTextAndTitleSettingsEditionPanel_webCard$key | null;
  /**
   * The content fontFamily currently set on the module
   */
  titleFontFamily: string;
  /**
   * A callback called when the user update the title fontFamily
   */
  onTitleFontFamilyChange: (fontFamily: string) => void;
  /**
   * The title fontColor currently set on the module
   */
  titleFontColor: string;
  /**
   * A callback called when the user update the titlefontColor
   */
  onTitleFontColorChange: (fontColor: string) => void;
  /**
   * The title textAlign currently set on the module
   */
  titleTextAlign: TextAlignment;
  /**
   * A callback called when the user update the title textAlign
   */
  onTitleTextAlignChange: (textAlign: TextAlignment) => void;
  /**
   * The title fontSize currently set on the module
   */
  titleFontSize: number;
  /**
   * A callback called when the user update the title fontSize
   */
  onTitleFontSizeChange: (fontSize: number) => void;
  /**
   * The title verticalSpacing currently set on the module
   */
  titleVerticalSpacing: number;
  /**
   * A callback called when the user update the title verticalSpacing
   */
  onTitleVerticalSpacingChange: (verticalSpacing: number) => void;
  /**
   * The content fontFamily currently set on the module
   */
  contentFontFamily: string;
  /**
   * A callback called when the user update the content fontFamily
   */
  onContentFontFamilyChange: (fontFamily: string) => void;
  /**
   * The content fontColor currently set on the module
   */
  contentFontColor: string;
  /**
   * A callback called when the user update the contentfontColor
   */
  onContentFontColorChange: (fontColor: string) => void;
  /**
   * The content textAlign currently set on the module
   */
  contentTextAlign: TextAlignment;
  /**
   * A callback called when the user update the content textAlign
   */
  onContentTextAlignChange: (textAlign: TextAlignment) => void;
  /**
   * The content fontSize currently set on the module
   */
  contentFontSize: number;
  /**
   * A callback called when the user update the content fontSize
   */
  onContentFontSizeChange: (fontSize: number) => void;
  /**
   * The content verticalSpacing currently set on the module
   */
  contentVerticalSpacing: number;
  /**
   * A callback called when the user update the content verticalSpacing
   */
  onContentVerticalSpacingChange: (verticalSpacing: number) => void;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;
};

/**
 * A Panel to edit the Settings of the PhotoWithTextAndTitle edition screen
 */
const PhotoWithTextAndTitleSettingsEditionPanel = ({
  webCard: webCardKey,
  titleFontFamily,
  onTitleFontFamilyChange,
  titleFontColor,
  onTitleFontColorChange,
  titleTextAlign,
  onTitleTextAlignChange,
  titleFontSize,
  onTitleFontSizeChange,
  titleVerticalSpacing,
  onTitleVerticalSpacingChange,
  contentFontFamily,
  onContentFontFamilyChange,
  contentFontColor,
  onContentFontColorChange,
  contentTextAlign,
  onContentTextAlignChange,
  contentFontSize,
  onContentFontSizeChange,
  contentVerticalSpacing,
  onContentVerticalSpacingChange,
  style,
  bottomSheetHeight,
  ...props
}: PhotoWithTextAndTitleSettingsEditionPanelProps) => {
  const intl = useIntl();
  const [currentTab, setCurrentTab] = useState<string>('title');

  const webCard = useFragment(
    graphql`
      fragment PhotoWithTextAndTitleSettingsEditionPanel_webCard on WebCard {
        ...WebCardColorPicker_webCard
        cardColors {
          primary
          light
          dark
        }
      }
    `,
    webCardKey,
  );

  const tabs = useMemo(() => {
    return [
      {
        tabKey: 'title',
        label: intl.formatMessage({
          defaultMessage: 'Title',
          description: 'Photo with Text and Title - TabBar Title',
        }),
      },
      {
        tabKey: 'text',
        label: intl.formatMessage({
          defaultMessage: 'Text',
          description: 'Photo with Text and Title - TabBar Text',
        }),
      },
    ];
  }, [intl]);

  return (
    <View style={[styles.root, style]} {...props}>
      <TabsBar
        currentTab={currentTab}
        onTabPress={setCurrentTab}
        tabs={tabs}
        decoration="underline"
      />
      <View style={styles.paramContainer}>
        <View style={styles.buttonContainer}>
          <FontDropDownPicker
            fontFamily={
              currentTab === 'title' ? titleFontFamily : contentFontFamily
            }
            onFontFamilyChange={
              currentTab === 'title'
                ? onTitleFontFamilyChange
                : onContentFontFamilyChange
            }
            bottomSheetHeight={bottomSheetHeight}
          />
          <WebCardColorDropDownPicker
            webCard={webCard}
            color={currentTab === 'title' ? titleFontColor : contentFontColor}
            onColorChange={
              currentTab === 'title'
                ? onTitleFontColorChange
                : onContentFontColorChange
            }
            bottomSheetHeight={bottomSheetHeight}
          />
          <AlignmentButton
            alignment={
              currentTab === 'title' ? titleTextAlign : contentTextAlign
            }
            onAlignmentChange={
              currentTab === 'title'
                ? onTitleTextAlignChange
                : onContentTextAlignChange
            }
          />
        </View>
        <View style={styles.titletextContainer}>
          <LabeledDashedSlider
            label={
              <FormattedMessage
                defaultMessage="Font size :"
                description="Font size message in PhotoWithTextAndTitle edition"
              />
            }
            initialValue={
              currentTab === 'title' ? titleFontSize : contentFontSize
            }
            min={
              currentTab === 'title'
                ? PHOTO_WITH_TEXT_AND_TITLE_MIN_TITLE_FONT_SIZE
                : PHOTO_WITH_TEXT_AND_TITLE_MIN_FONT_SIZE
            }
            max={
              currentTab === 'title'
                ? PHOTO_WITH_TEXT_AND_TITLE_MAX_TITLE_FONT_SIZE
                : PHOTO_WITH_TEXT_AND_TITLE_MAX_FONT_SIZE
            }
            step={1}
            onChange={
              currentTab === 'title'
                ? onTitleFontSizeChange
                : onContentFontSizeChange
            }
            accessibilityLabel={
              currentTab === 'title'
                ? intl.formatMessage({
                    defaultMessage: 'Title size',
                    description:
                      'Label of the Title size slider in PhotoWithTextAndTitle edition',
                  })
                : intl.formatMessage({
                    defaultMessage: 'Text size',
                    description:
                      'Label of the textSize slider in PhotoWithTextAndTitle edition',
                  })
            }
            accessibilityHint={
              currentTab === 'title'
                ? intl.formatMessage({
                    defaultMessage: 'Slide to change the Title size',
                    description:
                      'Hint of the Title size slider in PhotoWithTextAndTitle edition',
                  })
                : intl.formatMessage({
                    defaultMessage: 'Slide to change the Text size',
                    description:
                      'Hint of the textSize slider in PhotoWithTextAndTitle edition',
                  })
            }
            style={styles.slider}
          />
        </View>
        <LabeledDashedSlider
          label={
            <FormattedMessage
              defaultMessage="Vertical Spacing:"
              description="Vertical Spacing message in PhotoWithTextAndTitle edition"
            />
          }
          initialValue={
            currentTab === 'title'
              ? titleVerticalSpacing
              : contentVerticalSpacing
          }
          min={0}
          max={PHOTO_WITH_TEXT_AND_TITLE_MAX_VERTICAL_SPACING}
          step={1}
          onChange={
            currentTab === 'title'
              ? onTitleVerticalSpacingChange
              : onContentVerticalSpacingChange
          }
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Vertical Spacing',
            description:
              'Label of the Vertical Spacing slider in PhotoWithTextAndTitle edition',
          })}
          accessibilityHint={intl.formatMessage({
            defaultMessage: 'Slide to change theVertical Spacing',
            description:
              'Hint of the Vertical Spacing slider in PhotoWithTextAndTitle edition',
          })}
          style={styles.slider}
        />
      </View>
    </View>
  );
};

export default PhotoWithTextAndTitleSettingsEditionPanel;

const styles = StyleSheet.create({
  titletextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 30,
  },
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
  buttonContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    columnGap: 15,
  },
});
