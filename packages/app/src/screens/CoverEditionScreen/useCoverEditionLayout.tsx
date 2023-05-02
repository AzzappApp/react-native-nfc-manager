import useEditorLayout from '#hooks/useEditorLayout';
import {
  ICON_BUTTTON_SIZE,
  TOOL_BAR_HEIGHT,
  TOP_PANEL_GAP,
  TOP_PANEL_PADDING,
} from './coverEditionConstants';

const useCoverEditionLayout = () => {
  const {
    windowWidth,
    windowHeight,
    insetTop,
    insetBottom,
    contentHeight,
    bottomPanelHeight,
    topPanelHeight,
  } = useEditorLayout();

  const coverHeight =
    topPanelHeight - TOP_PANEL_PADDING - TOP_PANEL_GAP - TOOL_BAR_HEIGHT;
  const topPanelButtonsTop =
    (coverHeight - ICON_BUTTTON_SIZE) / 2 + TOP_PANEL_PADDING;

  const bottomSheetHeights = bottomPanelHeight - insetBottom - 10;

  return {
    windowWidth,
    windowHeight,
    contentHeight,
    bottomPanelHeight,
    topPanelHeight,
    coverHeight,
    topPanelButtonsTop,
    insetTop,
    insetBottom,
    bottomSheetHeights,
  };
};

export default useCoverEditionLayout;
