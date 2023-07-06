import { useRef, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { graphql, useLazyLoadQuery } from 'react-relay';
import {
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_SIMPLE_BUTTON,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  MODULE_KIND_SOCIAL_LINKS,
  MODULE_KIND_BLOCK_TEXT,
} from '@azzapp/shared/cardModuleHelpers';
import Container from '#ui/Container';
import TitleWithLine from '#ui/TitleWithLine';
import BlockTextRenderer, {
  BlockTextRendererRaw,
} from './cardModules/BlockTextRenderer';
import CarouselRenderer, {
  CarouselRendererRaw,
} from './cardModules/CarouselRenderer';
import HorizontalPhotoRenderer, {
  HorizontalPhotoRendererRaw,
} from './cardModules/HorizontalPhotoRenderer';
import LineDividerRenderer, {
  LineDividerRendererRaw,
} from './cardModules/LineDividerRenderer';
import PhotoWithTextAndTitleRenderer, {
  PhotoWithTextAndTitleRendererRaw,
} from './cardModules/PhotoWithTextAndTitleRenderer';
import SimpleButtonRenderer, {
  SimpleButtonRendererRaw,
} from './cardModules/SimpleButtonRenderer';
import SimpleTextRenderer, {
  SimpleTextRendererRaw,
} from './cardModules/SimpleTextRenderer';
import SocialLinksRenderer, {
  SocialLinksRendererRaw,
} from './cardModules/SocialLinksRenderer';
import CoverRenderer from './CoverRenderer';
import SwitchToggle from './SwitchToggle';
import type { BlockTextRawData } from './cardModules/BlockTextRenderer';
import type { CarouselRawData } from './cardModules/CarouselRenderer';
import type { HorizontalPhotoRawData } from './cardModules/HorizontalPhotoRenderer';
import type { LineDividerRawData } from './cardModules/LineDividerRenderer';
import type { PhotoWithTextAndTitleRawData } from './cardModules/PhotoWithTextAndTitleRenderer';
import type { SimpleButtonRawData } from './cardModules/SimpleButtonRenderer';
import type { SimpleTextRawData } from './cardModules/SimpleTextRenderer';
import type { WebCardPreviewQuery } from '@azzapp/relay/artifacts/WebCardPreviewQuery.graphql';
import type {
  LayoutChangeEvent,
  LayoutRectangle,
  ViewProps,
} from 'react-native';

type WebCardPreviewProps = Omit<ViewProps, 'children'> & {
  editedModuleId?: string;
  editedModuleInfo: ModuleInfo;
  visible: boolean;
  contentContainerStyle?: ViewProps['style'];
};

type SimpleTextModuleInfo = {
  kind: typeof MODULE_KIND_SIMPLE_TEXT | typeof MODULE_KIND_SIMPLE_TITLE;
  data: SimpleTextRawData;
};

type LineDividerModuleInfo = {
  kind: typeof MODULE_KIND_LINE_DIVIDER;
  data: LineDividerRawData;
};

type HorizontalPhotoModuleInfo = {
  kind: typeof MODULE_KIND_HORIZONTAL_PHOTO;
  data: HorizontalPhotoRawData;
};

type CarouselModuleInfo = {
  kind: typeof MODULE_KIND_CAROUSEL;
  data: CarouselRawData;
};

type SimpleButtonInfo = {
  kind: typeof MODULE_KIND_SIMPLE_BUTTON;
  data: SimpleButtonRawData;
};

type PhotoWithTextAndTitleInfo = {
  kind: typeof MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE;
  data: PhotoWithTextAndTitleRawData;
};

type SocialLinksModuleInfo = {
  kind: typeof MODULE_KIND_SOCIAL_LINKS;
  data: PhotoWithTextAndTitleRawData;
};

type BlockTextModuleInfo = {
  kind: typeof MODULE_KIND_BLOCK_TEXT;
  data: BlockTextRawData;
};

type ModuleInfo =
  | BlockTextModuleInfo
  | CarouselModuleInfo
  | HorizontalPhotoModuleInfo
  | LineDividerModuleInfo
  | PhotoWithTextAndTitleInfo
  | SimpleButtonInfo
  | SimpleTextModuleInfo
  | SocialLinksModuleInfo;

const WebCardPreview = ({
  editedModuleInfo,
  editedModuleId,
  visible,
  style,
  contentContainerStyle,
  ...props
}: WebCardPreviewProps) => {
  const {
    viewer: { profile },
  } = useLazyLoadQuery<WebCardPreviewQuery>(
    graphql`
      query WebCardPreviewQuery {
        viewer {
          profile {
            id
            userName
            card {
              id
              backgroundColor
              cover {
                ...CoverRenderer_cover
              }
              modules {
                id
                kind
                ...HorizontalPhotoRenderer_module
                ...SimpleTextRenderer_module
                ...LineDividerRenderer_module
                ...CarouselRenderer_module
                ...SimpleButtonRenderer_module
                ...PhotoWithTextAndTitleRenderer_module
                ...SocialLinksRenderer_module
                ...BlockTextRenderer_module
              }
            }
            ...ProfileColorPicker_profile
          }
        }
      }
    `,
    {},
  );

  const scrollViewRef = useRef<ScrollView | null>(null);
  const editeModuleLayoutRef = useRef<LayoutRectangle | null>(null);
  const scrollViewLayoutRef = useRef<LayoutRectangle | null>(null);

  const scrollToEditedModule = () => {
    if (
      !scrollViewRef.current ||
      !editeModuleLayoutRef.current ||
      !scrollViewLayoutRef.current
    ) {
      return;
    }
    const { y: moduleY, height: moduleHeight } = editeModuleLayoutRef.current;
    const { height: scrollViewHeight } = scrollViewLayoutRef.current;
    scrollViewRef.current.scrollTo({
      y: moduleY - scrollViewHeight / 2 + moduleHeight / 2,
      animated: false,
    });
  };

  const onEditedModuleLayout = ({
    nativeEvent: { layout },
  }: LayoutChangeEvent) => {
    editeModuleLayoutRef.current = layout;
    scrollToEditedModule();
  };

  const onScrollViewLayout = (event: LayoutChangeEvent) => {
    if (!scrollViewRef.current) {
      return;
    }
    scrollViewLayoutRef.current = event.nativeEvent.layout;
    scrollToEditedModule();
    props.onLayout?.(event);
  };

  const scrollRefCallback = (ref: ScrollView | null) => {
    scrollViewRef.current = ref;
    scrollToEditedModule();
  };
  useEffect(() => {
    if (visible) {
      scrollToEditedModule();
    }
  }, [visible]);

  const intl = useIntl();

  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');

  const { width: screenWidth } = useWindowDimensions();

  if (!profile?.card) {
    return null;
  }

  const {
    userName,
    card: { backgroundColor, cover, modules },
  } = profile;

  const renderEditedModule = () => {
    switch (editedModuleInfo.kind) {
      case MODULE_KIND_SIMPLE_TEXT:
      case MODULE_KIND_SIMPLE_TITLE:
        return (
          <SimpleTextRendererRaw
            data={{ ...editedModuleInfo.data, kind: editedModuleInfo.kind }}
            key={module.id}
            onLayout={onEditedModuleLayout}
          />
        );
      case MODULE_KIND_LINE_DIVIDER:
        return (
          <LineDividerRendererRaw
            data={editedModuleInfo.data}
            key={module.id}
            onLayout={onEditedModuleLayout}
          />
        );
      case MODULE_KIND_HORIZONTAL_PHOTO:
        return (
          <HorizontalPhotoRendererRaw
            data={editedModuleInfo.data}
            key={module.id}
            onLayout={onEditedModuleLayout}
          />
        );
      case MODULE_KIND_CAROUSEL:
        return (
          <CarouselRendererRaw
            data={editedModuleInfo.data}
            key={module.id}
            onLayout={onEditedModuleLayout}
          />
        );
      case MODULE_KIND_SIMPLE_BUTTON:
        return (
          <SimpleButtonRendererRaw
            data={editedModuleInfo.data}
            key={module.id}
            onLayout={onEditedModuleLayout}
          />
        );
      case MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE:
        return (
          <PhotoWithTextAndTitleRendererRaw
            data={editedModuleInfo.data}
            key={module.id}
            onLayout={onEditedModuleLayout}
            viewMode={viewMode}
          />
        );
      case MODULE_KIND_SOCIAL_LINKS:
        return (
          <SocialLinksRendererRaw
            data={editedModuleInfo.data}
            key={module.id}
            onLayout={onEditedModuleLayout}
          />
        );
      case MODULE_KIND_BLOCK_TEXT:
        return (
          <BlockTextRendererRaw
            data={editedModuleInfo.data}
            key={module.id}
            onLayout={onEditedModuleLayout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View {...props} style={[{ flex: 1 }, style]}>
      <Container style={{ padding: 8 }}>
        <TitleWithLine
          style={{ backgroundColor: 'transparent' }}
          title={intl.formatMessage({
            defaultMessage: 'Preview',
            description: 'Webcard preview - Preview title',
          })}
        />
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
      </Container>
      <ScrollView
        style={{ flex: 1, backgroundColor: backgroundColor ?? '#FFFFFF' }}
        onLayout={onScrollViewLayout}
        ref={scrollRefCallback}
        contentContainerStyle={contentContainerStyle}
      >
        <CoverRenderer
          cover={cover}
          userName={userName}
          width={screenWidth}
          hideBorderRadius
        />
        {modules.map(module => {
          if (editedModuleId === module.id) {
            return renderEditedModule();
          }
          switch (module.kind) {
            case MODULE_KIND_SIMPLE_TEXT:
            case MODULE_KIND_SIMPLE_TITLE:
              return <SimpleTextRenderer module={module} key={module.id} />;
            case MODULE_KIND_LINE_DIVIDER:
              return <LineDividerRenderer module={module} key={module.id} />;
            case MODULE_KIND_HORIZONTAL_PHOTO:
              return (
                <HorizontalPhotoRenderer module={module} key={module.id} />
              );
            case MODULE_KIND_CAROUSEL:
              return <CarouselRenderer module={module} key={module.id} />;
            case MODULE_KIND_SIMPLE_BUTTON:
              return <SimpleButtonRenderer module={module} key={module.id} />;
            case MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE:
              return (
                <PhotoWithTextAndTitleRenderer
                  module={module}
                  key={module.id}
                />
              );
            case MODULE_KIND_SOCIAL_LINKS:
              return <SocialLinksRenderer module={module} key={module.id} />;
            case MODULE_KIND_BLOCK_TEXT:
              return <BlockTextRenderer module={module} key={module.id} />;
            default:
              return null;
          }
        })}
        {!editedModuleId && renderEditedModule()}
      </ScrollView>
    </View>
  );
};

export default WebCardPreview;
