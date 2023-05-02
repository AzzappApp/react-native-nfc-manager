import { useMemo } from 'react';
import { KeyboardAvoidingView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Container from './Container';
import Header, { HEADER_HEIGHT } from './Header';
import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native-svg/lib/typescript/fabric/utils';

export type EditorLayoutMetrics = {
  insetTop: number;
  insetBottom: number;
  topPanelHeight: number;
  bottomPanelHeight: number;
};

export type EditorLayoutProps = Omit<ViewProps, 'children'> & {
  /**
   * The top panel to display.
   */
  renderTopPanel: (metrics: EditorLayoutMetrics) => React.ReactElement | null;

  /**
   * The bottom panel to display.
   */
  renderBottomPanel: (
    metrics: EditorLayoutMetrics,
  ) => React.ReactElement | null;

  /**
   * The aspectRatio of the top panel.
   * this ratio won't be applied if it's not possible to apply it while
   * keeping the bottom panel min height.
   * @default 1
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
   * The title to display in the header.
   */
  headerMiddleElement?: ReactNode;
  /**
   * The left button to display in the header.
   */
  headerLeftElement?: ReactNode;
  /**
   * The right button to display in the header.
   */
  headerrightElement?: ReactNode;
};

const EditorLayout = ({
  renderTopPanel,
  renderBottomPanel,
  topPanelAspectRatio = 1,
  screenMargin = SCREEN_MARGIN,
  bottomPanelMinHeight = BOTTOM_PANEL_MIN_HEIGHT,
  headerMiddleElement,
  headerLeftElement,
  headerrightElement,
  style,
  ...props
}: EditorLayoutProps) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const inset = useSafeAreaInsets();

  const insetTop = inset.top > 25 ? inset.top : inset.top + screenMargin;
  const insetBottom = inset.bottom > 0 ? inset.bottom : screenMargin;

  const contentHeight = windowHeight - insetTop - HEADER_HEIGHT;
  const topPanelHeight = Math.min(
    contentHeight - bottomPanelMinHeight,
    topPanelAspectRatio != null
      ? windowWidth / topPanelAspectRatio
      : contentHeight / 2,
  );
  const bottomPanelHeight = contentHeight - topPanelHeight;

  const metrics = useMemo<EditorLayoutMetrics>(
    () => ({
      insetTop,
      insetBottom,
      topPanelHeight,
      bottomPanelHeight,
    }),
    [insetBottom, bottomPanelHeight, insetTop, topPanelHeight],
  );

  return (
    <Container
      style={[{ width: windowWidth, height: windowHeight }, style]}
      {...props}
    >
      <KeyboardAvoidingView
        contentContainerStyle={{
          width: '100%',
          height: '100%',
          paddingTop: insetTop,
        }}
        behavior="position"
      >
        <Header
          middleElement={headerMiddleElement}
          leftElement={headerLeftElement}
          rightElement={headerrightElement}
        />
        <View style={{ height: topPanelHeight }}>
          {renderTopPanel(metrics)}
        </View>
        <View style={{ height: bottomPanelHeight }}>
          {renderBottomPanel(metrics)}
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default EditorLayout;

export const SCREEN_MARGIN = 15;

export const BOTTOM_PANEL_MIN_HEIGHT = 320;
