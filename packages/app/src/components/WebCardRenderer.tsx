import { forwardRef } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import CardModuleRenderer from './cardModules/CardModuleRenderer';
import CoverRenderer from './CoverRenderer';
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
    viewMode: _viewMode,
    onModuleLayout,
    style,
    ...props
  }: WebCardRendererProps,
  ref: ForwardedRef<ScrollView>,
) => {
  const { width: windowWidth } = useWindowDimensions();

  const lastModule = cardModules.at(-1);
  const overrideLastModule =
    lastModule && 'data' in lastModule ? lastModule : null;

  return (
    <ScrollView ref={ref} style={[{ flex: 1 }, style]} {...props}>
      <WebCardBackground
        profile={profile}
        overrideCardStyle={cardStyle}
        overrideLastModule={overrideLastModule}
        style={{
          position: 'absolute',
          width: '100%',
          height: '150%',
          top: '-25%',
          left: 0,
          zIndex: -1,
        }}
      />
      <CoverRenderer profile={profile} width={windowWidth} hideBorderRadius />
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
          />
        );
      })}
    </ScrollView>
  );
};

export default forwardRef(WebCardRenderer);

export const DESKTOP_PREVIEW_WIDTH = 900;
