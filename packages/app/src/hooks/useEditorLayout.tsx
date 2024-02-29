import { useMemo } from 'react';
import { Dimensions, StatusBar } from 'react-native';
import { HEADER_HEIGHT } from '#ui/Header';
import useScreenInsets from './useScreenInsets';

type EditorLayoutConfig = {
  /**
   * The aspectRatio of the top panel.
   * this ratio won't be applied if it's not possible to apply it while
   * keeping the bottom panel min height.
   * @default null
   */
  topPanelAspectRatio?: number | null;

  /**
   * The margin to apply to the screen.
   * @default SCREEN_MARGIN
   */
  screenMargin?: number;

  /**
   * The minimum height of the bottom panel.
   * @default BOTTOM_PANEL_MIN_HEIGHT
   */
  bottomPanelMinHeight?: number;
  /**
   * The height of the header.
   * @default HEADER_HEIGHT
   */
  headerHeight?: number;
};

const { width: windowWidth, height: windowHeight } = Dimensions.get('screen');

const useEditorLayout = ({
  bottomPanelMinHeight = BOTTOM_PANEL_MIN_HEIGHT,
  headerHeight = HEADER_HEIGHT,
  topPanelAspectRatio = null,
}: EditorLayoutConfig = {}) => {
  const inset = useScreenInsets();

  const insetTop = inset.top;
  const insetBottom = inset.bottom;

  const contentHeight = useMemo(() => {
    return (
      windowHeight - insetTop - headerHeight - (StatusBar.currentHeight ?? 0)
    );
  }, [headerHeight, insetTop]);

  const topPanelHeight = useMemo(() => {
    return Math.min(
      contentHeight - bottomPanelMinHeight,
      topPanelAspectRatio != null
        ? windowWidth / topPanelAspectRatio
        : contentHeight / 2,
    );
  }, [bottomPanelMinHeight, contentHeight, topPanelAspectRatio]);

  const bottomPanelHeight = useMemo(() => {
    return contentHeight - topPanelHeight;
  }, [contentHeight, topPanelHeight]);

  return {
    windowWidth,
    windowHeight,
    contentHeight,
    bottomPanelHeight,
    topPanelHeight,
    insetTop,
    insetBottom,
  };
};

export default useEditorLayout;

export const SCREEN_MARGIN = 15;

export const BOTTOM_PANEL_MIN_HEIGHT = 320;
