import { forwardRef } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import {
  MODULE_KIND_BLOCK_TEXT,
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  MODULE_KIND_SIMPLE_BUTTON,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_SOCIAL_LINKS,
} from '@azzapp/shared/cardModuleHelpers';
import BlockTextRenderer, {
  BlockTextRendererRaw,
  type BlockTextRawData,
} from './cardModules/BlockTextRenderer';
import CarouselRenderer, {
  CarouselRendererRaw,
  type CarouselRawData,
} from './cardModules/CarouselRenderer';
import HorizontalPhotoRenderer, {
  HorizontalPhotoRendererRaw,
  type HorizontalPhotoRawData,
} from './cardModules/HorizontalPhotoRenderer';
import LineDividerRenderer, {
  LineDividerRendererRaw,
  type LineDividerRawData,
} from './cardModules/LineDividerRenderer';
import PhotoWithTextAndTitleRenderer, {
  PhotoWithTextAndTitleRendererRaw,
  type PhotoWithTextAndTitleRawData,
} from './cardModules/PhotoWithTextAndTitleRenderer';
import SimpleButtonRenderer, {
  SimpleButtonRendererRaw,
  type SimpleButtonRawData,
} from './cardModules/SimpleButtonRenderer';
import SimpleTextRenderer, {
  SimpleTextRendererRaw,
  type SimpleTextRawData,
} from './cardModules/SimpleTextRenderer';
import SocialLinksRenderer, {
  SocialLinksRendererRaw,
} from './cardModules/SocialLinksRenderer';
import CoverRenderer from './CoverRenderer';
import WebCardBackground from './WebCardBackground';
import type { SocialLinksRawData } from './cardModules/SocialLinksRenderer';
import type { BlockTextRenderer_module$key } from '@azzapp/relay/artifacts/BlockTextRenderer_module.graphql';
import type { CarouselRenderer_module$key } from '@azzapp/relay/artifacts/CarouselRenderer_module.graphql';
import type { CoverRenderer_profile$key } from '@azzapp/relay/artifacts/CoverRenderer_profile.graphql';
import type { HorizontalPhotoRenderer_module$key } from '@azzapp/relay/artifacts/HorizontalPhotoRenderer_module.graphql';
import type { LineDividerRenderer_module$key } from '@azzapp/relay/artifacts/LineDividerRenderer_module.graphql';
import type { PhotoWithTextAndTitleRenderer_module$key } from '@azzapp/relay/artifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type { SimpleButtonRenderer_module$key } from '@azzapp/relay/artifacts/SimpleButtonRenderer_module.graphql';
import type { SimpleTextRenderer_module$key } from '@azzapp/relay/artifacts/SimpleTextRenderer_module.graphql';
import type { SocialLinksRenderer_module$key } from '@azzapp/relay/artifacts/SocialLinksRenderer_module.graphql';
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
  cardModules: ModuleInfo[];
  /**
   * Called when a module is layouted.
   *
   * @param index The module index.
   * @param layout The module layout.
   */
  onModuleLayout?: (index: number, layout: LayoutRectangle) => void;
};

// clearly ugly, but here relay play against us
type ModuleInfoBase<TKind extends string, TData, TFragmentKey> =
  | {
      kind: TKind;
      data: TData;
    }
  | {
      kind: TKind;
      key: TFragmentKey;
    };

type SimpleTextModuleInfo = ModuleInfoBase<
  typeof MODULE_KIND_SIMPLE_TEXT | typeof MODULE_KIND_SIMPLE_TITLE,
  SimpleTextRawData,
  SimpleTextRenderer_module$key
>;

type LineDividerModuleInfo = ModuleInfoBase<
  typeof MODULE_KIND_LINE_DIVIDER,
  LineDividerRawData,
  LineDividerRenderer_module$key
>;

type HorizontalPhotoModuleInfo = ModuleInfoBase<
  typeof MODULE_KIND_HORIZONTAL_PHOTO,
  HorizontalPhotoRawData,
  HorizontalPhotoRenderer_module$key
>;

type CarouselModuleInfo = ModuleInfoBase<
  typeof MODULE_KIND_CAROUSEL,
  CarouselRawData,
  CarouselRenderer_module$key
>;

type SimpleButtonInfo = ModuleInfoBase<
  typeof MODULE_KIND_SIMPLE_BUTTON,
  SimpleButtonRawData,
  SimpleButtonRenderer_module$key
>;

type PhotoWithTextAndTitleInfo = ModuleInfoBase<
  typeof MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  PhotoWithTextAndTitleRawData,
  PhotoWithTextAndTitleRenderer_module$key
>;

type SocialLinksModuleInfo = ModuleInfoBase<
  typeof MODULE_KIND_SOCIAL_LINKS,
  SocialLinksRawData,
  SocialLinksRenderer_module$key
>;

type BlockTextModuleInfo = ModuleInfoBase<
  typeof MODULE_KIND_BLOCK_TEXT,
  BlockTextRawData,
  BlockTextRenderer_module$key
>;

export type ModuleInfo =
  | BlockTextModuleInfo
  | CarouselModuleInfo
  | HorizontalPhotoModuleInfo
  | LineDividerModuleInfo
  | PhotoWithTextAndTitleInfo
  | SimpleButtonInfo
  | SimpleTextModuleInfo
  | SocialLinksModuleInfo;

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
        const ModuleRenderer = MODULE_RENDERERS[module.kind];
        if (ModuleRenderer) {
          if ('key' in module) {
            return (
              <ModuleRenderer.relay
                module={module.key as any}
                key={index}
                onLayout={onLayout}
                colorPalette={cardColors}
                cardStyle={cardStyle}
              />
            );
          }
          return (
            <ModuleRenderer.raw
              data={module.data as any}
              key={index}
              onLayout={onLayout}
              colorPalette={cardColors}
              cardStyle={cardStyle}
            />
          );
        }
        return null;
      })}
    </ScrollView>
  );
};

const MODULE_RENDERERS = {
  [MODULE_KIND_SIMPLE_TEXT]: {
    raw: SimpleTextRendererRaw,
    relay: SimpleTextRenderer,
  },
  [MODULE_KIND_SIMPLE_TITLE]: {
    raw: SimpleTextRendererRaw,
    relay: SimpleTextRenderer,
  },
  [MODULE_KIND_LINE_DIVIDER]: {
    raw: LineDividerRendererRaw,
    relay: LineDividerRenderer,
  },
  [MODULE_KIND_HORIZONTAL_PHOTO]: {
    raw: HorizontalPhotoRendererRaw,
    relay: HorizontalPhotoRenderer,
  },
  [MODULE_KIND_CAROUSEL]: {
    raw: CarouselRendererRaw,
    relay: CarouselRenderer,
  },
  [MODULE_KIND_SIMPLE_BUTTON]: {
    raw: SimpleButtonRendererRaw,
    relay: SimpleButtonRenderer,
  },
  [MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE]: {
    raw: PhotoWithTextAndTitleRendererRaw,
    relay: PhotoWithTextAndTitleRenderer,
  },
  [MODULE_KIND_SOCIAL_LINKS]: {
    raw: SocialLinksRendererRaw,
    relay: SocialLinksRenderer,
  },
  [MODULE_KIND_BLOCK_TEXT]: {
    raw: BlockTextRendererRaw,
    relay: BlockTextRenderer,
  },
};

export default forwardRef(WebCardRenderer);

export const DESKTOP_PREVIEW_WIDTH = 900;
