import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useFragment, graphql } from 'react-relay';
import { WebCardBoundEditorLayerSelectorPanel } from '#components/EditorLayerSelectorPanel';
import type { SocialLinksBackgroundEditionPanel_viewer$key } from '#relayArtifacts/SocialLinksBackgroundEditionPanel_viewer.graphql';
import type { ViewProps } from 'react-native';

type BackgroundStyle = {
  backgroundColor: string;
  patternColor: string;
};

type SocialLinksBackgroundEditionPanelProps = ViewProps & {
  /**
   * A relay fragment reference to the viewer
   */
  viewer: SocialLinksBackgroundEditionPanel_viewer$key;
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
 * A Panel to edit the Background of the SocialLinks edition screen
 */
const SocialLinksBackgroundEditionPanel = ({
  viewer,
  backgroundId: background,
  backgroundStyle,
  onBackgroundChange,
  onBackgroundStyleChange,
  bottomSheetHeight,
  ...props
}: SocialLinksBackgroundEditionPanelProps) => {
  const { moduleBackgrounds, profile } = useFragment(
    graphql`
      fragment SocialLinksBackgroundEditionPanel_viewer on Viewer {
        moduleBackgrounds {
          ...StaticMediaList_staticMedias
        }
        profile {
          webCard {
            ...WebCardColorPicker_webCard
          }
        }
      }
    `,
    viewer,
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
        medias={moduleBackgrounds}
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

export default SocialLinksBackgroundEditionPanel;

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
  mediaSelector: {
    flex: 1,
    marginBottom: 20,
  },
});
