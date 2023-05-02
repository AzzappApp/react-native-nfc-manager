import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_HEIGHT } from '#ui/Header';
import {
  FIXED_MARGIN,
  ICON_BUTTTON_SIZE,
  MINIMAL_BOTTOM_HEIGHT,
  TOOL_BAR_HEIGHT,
  TOP_PANEL_GAP,
  TOP_PANEL_PADDING,
} from './coverEditionConstants';

const useCoverEditionLayout = () => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const topMargin = inset.top > 25 ? inset.top : inset.top + FIXED_MARGIN;
  const bottomMargin = inset.bottom > 0 ? inset.bottom : FIXED_MARGIN;

  const contentHeight = windowHeight - topMargin - HEADER_HEIGHT;
  const bottomPanelHeight = Math.max(MINIMAL_BOTTOM_HEIGHT, contentHeight / 2);
  const topPanelHeight = contentHeight - bottomPanelHeight;
  const coverHeight =
    topPanelHeight - TOP_PANEL_PADDING - TOP_PANEL_GAP - TOOL_BAR_HEIGHT;
  const topPanelButtonsTop =
    (coverHeight - ICON_BUTTTON_SIZE) / 2 + TOP_PANEL_PADDING;

  const bottomSheetHeights = bottomPanelHeight - inset.bottom - 10;

  return {
    windowWidth,
    windowHeight,
    contentHeight,
    bottomPanelHeight,
    topPanelHeight,
    coverHeight,
    topPanelButtonsTop,
    topMargin,
    bottomMargin,
    bottomSheetHeights,
  };
};

export default useCoverEditionLayout;
