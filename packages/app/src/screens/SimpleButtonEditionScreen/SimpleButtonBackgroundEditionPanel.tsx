import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import { WebCardBoundEditorLayerSelectorPanel } from '#components/EditorLayerSelectorPanel';
import type { SimpleButtonBackgroundEditionPanel_profile$key } from '#relayArtifacts/SimpleButtonBackgroundEditionPanel_profile.graphql';
import type { ViewProps } from 'react-native';

type BackgroundStyle = {
  backgroundColor: string;
  patternColor: string;
};

type SimpleButtonBackgroundEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the viewer
   */
  profile: SimpleButtonBackgroundEditionPanel_profile$key;
  /**
   * The currently selected background id
   */
  backgroundId: string | null | undefined;
  /**
   * The currently selected background style
   */
  backgroundStyle: BackgroundStyle | null | undefined;
  /**
   * A callback called when the user select a new background
   * @param backgroundId The new background id, or null if the user select the "none" option
   */
  onBackgroundChange: (backgroundId: string | null) => void;
  /**
   * A callback called when the user update the background style
   */
  onBackgroundStyleChange: (style: BackgroundStyle) => void;
  /**
   * The height of the bottom sheet
   */
  bottomSheetHeight: number;
};

/**
 * A Panel to edit the Background of the SimpleButton edition screen
 */
const SimpleButtonBackgroundEditionPanel = ({
  profile: profileKey,
  backgroundId: background,
  backgroundStyle,
  onBackgroundChange,
  onBackgroundStyleChange,
  bottomSheetHeight,
  ...props
}: SimpleButtonBackgroundEditionPanelProps) => {
  const profile = useFragment(
    graphql`
      fragment SimpleButtonBackgroundEditionPanel_profile on Profile {
        moduleBackgrounds {
          ...StaticMediaList_staticMedias
        }
        webCard {
          ...WebCardBackground_webCard
          ...WebCardColorPicker_webCard
        }
      }
    `,
    profileKey,
  );

  const backgroundColor = backgroundStyle?.backgroundColor ?? '#FFFFFF';
  const patternColor = backgroundStyle?.patternColor ?? '#000000';

  const onColorChange = useCallback(
    (color: 'backgroundColor' | 'tintColor', value: string) => {
      if (color === 'backgroundColor') {
        onBackgroundStyleChange({
          backgroundColor: value,
          patternColor,
        });
      } else {
        onBackgroundStyleChange({
          backgroundColor,
          patternColor: value,
        });
      }
    },
    [backgroundColor, onBackgroundStyleChange, patternColor],
  );

  const intl = useIntl();

  return (
    <View {...props}>
      <WebCardBoundEditorLayerSelectorPanel
        title={intl.formatMessage({
          defaultMessage: 'Background',
          description: 'Label of Background tab in Horizontal photo edition',
        })}
        webCard={profile?.webCard ?? null}
        medias={profile.moduleBackgrounds}
        selectedMedia={background}
        tintColor={patternColor}
        backgroundColor={backgroundColor}
        onMediaChange={onBackgroundChange}
        onColorChange={onColorChange}
        bottomSheetHeight={bottomSheetHeight}
        svgMode
        imageRatio={1}
        style={styles.mediaSelector}
      />
    </View>
  );
};

export default SimpleButtonBackgroundEditionPanel;

const styles = StyleSheet.create({
  mediaSelector: {
    flex: 1,
    marginBottom: 20,
  },
  slider: {
    width: '90%',
    alignSelf: 'center',
    marginBottom: 25,
  },
});
