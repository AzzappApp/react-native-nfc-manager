import { forwardRef, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { View, useWindowDimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import CardModuleRenderer from './cardModules/CardModuleRenderer';
import CoverRenderer, { CoverRendererPreviewDesktop } from './CoverRenderer';
import SwitchToggle from './SwitchToggle';
import WebCardBackground from './WebCardBackground';
import type { ModuleRenderInfo } from './cardModules/CardModuleRenderer';
import type { CoverRenderer_profile$key } from '@azzapp/relay/artifacts/CoverRenderer_profile.graphql';
import type { WebCardBackground_profile$key } from '@azzapp/relay/artifacts/WebCardBackground_profile.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { ForwardedRef } from 'react';
import type { LayoutRectangle, PointProp, ViewProps } from 'react-native';

export type WebCardPreviewProps = Omit<ViewProps, 'children'> & {
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
   * The modules list to render.
   */
  cardModules: ModuleRenderInfo[];
  /**
   * The height of the preview.
   */
  height: number;
  /**
   * @see ScrollViewProps#contentOffset
   */
  contentOffset?: PointProp | undefined; // zeros
  /**
   * scrollView contentContainer padding bottom
   * @default 0
   */
  contentPaddingBottom?: number;
  /**
   * Called when a module is layouted.
   *
   * @param index The module index.
   * @param layout The module layout.
   */
  onModuleLayout?: (index: number, layout: LayoutRectangle) => void;
};

/**
 * This component is used to preview a web card in mobile or desktop mode.
 */
const WebCardPreview = (
  {
    profile,
    cardModules,
    cardColors,
    cardStyle,
    onModuleLayout,
    height,
    contentOffset,
    contentPaddingBottom = 0,
    style,
    ...props
  }: WebCardPreviewProps,
  ref: ForwardedRef<ScrollView>,
) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');

  const { width: windowWidth } = useWindowDimensions();
  const scale = viewMode === 'mobile' ? 1 : windowWidth / DESKTOP_PREVIEW_WIDTH;
  const webCardWidth =
    viewMode === 'mobile' ? windowWidth : DESKTOP_PREVIEW_WIDTH;
  const webCardOuterHeight = height - SWITCH_TOGGLE_SECTION_HEIGHT;
  const webCardHeight = webCardOuterHeight / scale;

  const intl = useIntl();

  const contentRef = useRef<View>(null);

  const onModuleLayoutInner = (index: number, moduleView: View) => {
    if (
      !onModuleLayout ||
      !contentRef.current ||
      // we take some precautions to avoid type mismatch
      !moduleView ||
      typeof moduleView !== 'object' ||
      !('measureLayout' in moduleView)
    ) {
      return;
    }
    moduleView.measureLayout(contentRef.current, (x, y, width, height) => {
      onModuleLayout(index, { x, y, width, height });
    });
  };

  return (
    <View
      style={{
        width: windowWidth,
        height,
      }}
      {...props}
    >
      <View
        style={{
          paddingHorizontal: 20,
          height: SWITCH_TOGGLE_SECTION_HEIGHT,
          justifyContent: 'center',
        }}
      >
        <SwitchToggle
          value={viewMode}
          onChange={setViewMode}
          values={[
            {
              value: 'mobile',
              label: intl.formatMessage({
                defaultMessage: 'Mobile',
                description: 'Mobile view mode title in web card preview',
              }),
            },
            {
              value: 'desktop',
              label: intl.formatMessage({
                defaultMessage: 'Desktop',
                description: 'Desktop view mode title in web card preview',
              }),
            },
          ]}
        />
      </View>
      <View
        style={{
          overflow: 'hidden',
          width: webCardWidth,
          height: webCardHeight,
          transform: [
            { translateX: (windowWidth - webCardWidth) / 2 },
            { translateY: (webCardOuterHeight - webCardHeight) / 2 },
            { scale },
          ],
        }}
      >
        <ScrollView
          ref={ref}
          style={[{ flex: 1 }, style]}
          contentOffset={contentOffset}
          contentContainerStyle={{
            paddingBottom: contentPaddingBottom * scale,
          }}
        >
          <View ref={contentRef}>
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
            {cardModules.map((module, index) => (
              <CardModuleRenderer
                module={module}
                key={index}
                onLayout={e =>
                  onModuleLayoutInner?.(index, e.target as unknown as View)
                }
                colorPalette={cardColors}
                cardStyle={cardStyle}
                viewMode={viewMode}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default forwardRef(WebCardPreview);

const SWITCH_TOGGLE_SECTION_HEIGHT = 52;

export const DESKTOP_PREVIEW_WIDTH = 900;
