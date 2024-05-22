import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { graphql, useFragment } from 'react-relay';
import WebCardColorPicker from '#components/WebCardColorPicker';
import useToggle from '#hooks/useToggle';
import ToolBoxSection from '#ui/ToolBoxSection';
import { CoverEditorActionType } from '../coverEditorActions';
import {
  useCoverEditorContext,
  useCoverEditorTextLayer,
} from '../CoverEditorContext';
import type { CoverEditorColorTool_webCard$key } from '#relayArtifacts/CoverEditorColorTool_webCard.graphql';

type Props = {
  webcard: CoverEditorColorTool_webCard$key;
};

const CoverEditorColorTool = ({ webcard: webcardKey }: Props) => {
  const intl = useIntl();
  const [show, toggleBottomSheet] = useToggle(false);

  const layer = useCoverEditorTextLayer();
  const { dispatch } = useCoverEditorContext();

  const webCard = useFragment(
    graphql`
      fragment CoverEditorColorTool_webCard on WebCard {
        ...WebCardColorPicker_webCard
        cardColors {
          primary
          dark
          light
        }
      }
    `,
    webcardKey,
  );

  const onColorChange = useCallback(
    (fontColor: string) => {
      dispatch({
        type: CoverEditorActionType.ChangeFontColor,
        payload: {
          fontColor,
        },
      });
    },
    [dispatch],
  );

  // @TODO: might be another data source than text layer
  const selectedColor = layer?.style.color ?? '#000';

  return (
    <>
      <ToolBoxSection
        label={intl.formatMessage({
          defaultMessage: 'Color',
          description: 'Cover Edition - Toolbox sub-menu text - Color',
        })}
        icon={`font_color`}
        onPress={toggleBottomSheet}
      />

      <WebCardColorPicker
        visible={show}
        height={250}
        webCard={webCard}
        title={intl.formatMessage({
          defaultMessage: ' color',
          description: ' color title in BlockText edition',
        })}
        selectedColor={selectedColor}
        onColorChange={onColorChange}
        onRequestClose={toggleBottomSheet}
        canEditPalette={true}
      />
    </>
  );
};

export default CoverEditorColorTool;
