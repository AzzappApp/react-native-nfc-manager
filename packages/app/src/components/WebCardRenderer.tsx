import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import CardModuleRenderer from './cardModules/CardModuleRenderer';
import CoverRenderer, { CoverRendererPreviewDesktop } from './CoverRenderer';
import WebCardBackground from './WebCardBackground';
import type { ModuleRenderInfo } from './cardModules/CardModuleRenderer';
import type { CoverRenderer_profile$key } from '@azzapp/relay/artifacts/CoverRenderer_profile.graphql';
import type { WebCardBackground_profile$key } from '@azzapp/relay/artifacts/WebCardBackground_profile.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ForwardedRef } from 'react';
import type {
  LayoutChangeEvent,
  LayoutRectangle,
  ScrollViewProps,
} from 'react-native';

export type WebCardRendererProps = Omit<ScrollViewProps, 'children'> & {
  /**
   * The profile to render.
   * Contains the cover informations.
   */
  profile: CoverRenderer_profile$key & WebCardBackground_profile$key;
  /**
   * The card style to use.
   */
  cardStyle: CardStyle | null;
  /**
   * The card colors to use.
   */
  cardColors?: ColorPalette | null;
  /**
   * Should the preview be rendered in mobile or desktop mode.
   */
  viewMode: 'desktop' | 'mobile';
  /**
   * The modules list to render.
   */
  cardModules: ModuleRenderInfo[];
  /**
   * Called when a module is layouted.
   *
   * @param index The module index.
   * @param layout The module layout.
   */
  onModuleLayout?: (index: number, layout: LayoutRectangle) => void;
  /**
   * define if the list shoudl handle  the touch action on each module (using pointer events)
   *
   * @type {boolean}
   */
  moduleActionEnabled?: boolean;
};

/**
 * This component is used to render a web card.
 * It is used to be able to preview changes in the different editors.
 */
const WebCardRenderer = (
  {
    profile,
    cardModules,
    cardColors,
    cardStyle,
    viewMode,
    onModuleLayout,
    style,
    moduleActionEnabled = true,
    ...props
  }: WebCardRendererProps,
  ref: ForwardedRef<ScrollView>,
) => {
  const { width: windowWidth } = useWindowDimensions();

  const scrollViewRef = useRef<ScrollView | null>(null);
  const mergeRef = useCallback(
    (value: ScrollView | null) => {
      scrollViewRef.current = value;
      if (typeof ref === 'function') {
        ref?.(value);
      } else if (ref) {
        ref.current = value;
      }
    },
    [ref],
  );

  useEffect(() => {
    if (viewMode === 'desktop') {
      if (props.contentOffset?.y !== undefined) {
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: false,
        });
      }
    }
  }, [props.contentOffset?.y, viewMode, windowWidth]);

  return (
    <ScrollView
      ref={mergeRef}
      style={[{ flex: 1 }, style]}
      scrollEventThrottle={16}
      {...props}
    >
      <View pointerEvents={moduleActionEnabled ? 'box-none' : 'none'}>
        <WebCardBackground
          profile={profile}
          overrideCardStyle={cardStyle}
          overrideLastModule={cardModules.at(-1)}
          style={{
            position: 'absolute',
            width: '100%',
            height: '150%',
            top: '-25%',
            left: 0,
            zIndex: -1,
          }}
        />
        {viewMode === 'desktop' ? (
          <CoverRendererPreviewDesktop profile={profile} />
        ) : (
          <CoverRenderer
            profile={profile}
            width={windowWidth}
            hideBorderRadius
          />
        )}
        {cardModules.map((module, index) => {
          const onLayout = onModuleLayout
            ? (e: LayoutChangeEvent) => {
                onModuleLayout?.(index, e.nativeEvent.layout);
              }
            : undefined;
          return (
            <CardModuleRenderer
              module={module}
              key={index}
              onLayout={onLayout}
              colorPalette={cardColors}
              cardStyle={cardStyle}
              viewMode={viewMode}
            />
          );
        })}
      </View>
    </ScrollView>
  );
};

export default forwardRef(WebCardRenderer);

export const DESKTOP_PREVIEW_WIDTH = 900;
