import { useRef, useEffect, useState, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import Container from '#ui/Container';
import TitleWithLine from '#ui/TitleWithLine';
import { useModulesData } from './cardModules/ModuleData';
import SwitchToggle from './SwitchToggle';
import WebCardRenderer, { DESKTOP_PREVIEW_WIDTH } from './WebCardRenderer';
import type { ModuleRenderInfo } from './cardModules/CardModuleRenderer';
import type { WebCardModulePreviewQuery } from '@azzapp/relay/artifacts/WebCardModulePreviewQuery.graphql';
import type {
  LayoutChangeEvent,
  LayoutRectangle,
  ViewProps,
  ScrollView,
} from 'react-native';

type WebCardModulePreviewProps = Omit<ViewProps, 'children'> & {
  /**
   * The module id to replace.
   * If not provided, the module will be added at the end.
   */
  editedModuleId?: string;
  /**
   * The module rendering informations.
   */
  editedModuleInfo: ModuleRenderInfo;
  /**
   * Does the preview is visible.
   */
  visible: boolean;
  /**
   * The content container style of the web card preview scroll view.
   */
  contentContainerStyle?: ViewProps['style'];
};

/**
 * Render a preview of a web card by replacing or adding a module.
 */
const WebCardModulePreview = ({
  editedModuleInfo,
  editedModuleId,
  visible,
  style,
  contentContainerStyle,
  ...props
}: WebCardModulePreviewProps) => {
  const {
    viewer: { profile },
  } = useLazyLoadQuery<WebCardModulePreviewQuery>(
    graphql`
      query WebCardModulePreviewQuery @raw_response_type {
        viewer {
          profile {
            id
            ...CoverRenderer_profile
            ...WebCardBackground_profile
            cardStyle {
              borderColor
              borderRadius
              buttonRadius
              borderWidth
              buttonColor
              fontFamily
              fontSize
              gap
              titleFontFamily
              titleFontSize
            }
            cardModules {
              id
              visible
              ...ModuleData_cardModules
            }
            cardColors {
              primary
              dark
              light
            }
          }
        }
      }
    `,
    {},
  );

  const cardModules = useModulesData(profile?.cardModules ?? []);

  const { editedIndex, modules } = useMemo(() => {
    if (!profile) {
      return { modules: [editedModuleInfo], editedIndex: 0 };
    }
    let editedIndex = 0;
    const modules = convertToNonNullArray(
      cardModules.map((module, index) => {
        if (module.id === editedModuleId) {
          editedIndex = index;
          return editedModuleInfo;
        } else if (module.visible) {
          return module;
        }
        return null;
      }),
    );
    if (!editedModuleId) {
      editedIndex = modules.length;
      modules.push(editedModuleInfo);
    }
    return { editedIndex, modules };
  }, [profile, cardModules, editedModuleId, editedModuleInfo]);

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

  const onEditedModuleLayout = (index: number, layout: LayoutRectangle) => {
    if (index !== editedIndex) {
      return;
    }
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

  const [containerDimensions, setContainerDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });

  const onContainerLayout = (event: LayoutChangeEvent) => {
    setContainerDimensions(event.nativeEvent.layout);
  };

  const scale =
    viewMode === 'mobile'
      ? 1
      : containerDimensions.width / DESKTOP_PREVIEW_WIDTH;

  const webCardWidth =
    viewMode === 'mobile' ? containerDimensions.width : DESKTOP_PREVIEW_WIDTH;
  const webCardHeight = containerDimensions.height / scale;

  const flatContainerStyle = StyleSheet.flatten(contentContainerStyle);

  const transformedContentContainerStyle = {
    ...flatContainerStyle,
    paddingBottom: ((flatContainerStyle?.paddingBottom as number) ?? 0) / scale,
    paddingTop: ((flatContainerStyle?.paddingTop as number) ?? 0) / scale,
  };

  if (!profile) {
    return null;
  }

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
      <View style={{ flex: 1 }} onLayout={onContainerLayout}>
        <View
          style={{
            width: webCardWidth,
            height: webCardHeight,
            transform: [
              { translateX: (containerDimensions.width - webCardWidth) / 2 },
              { translateY: (containerDimensions.height - webCardHeight) / 2 },
              { scale },
            ],
          }}
        >
          <WebCardRenderer
            profile={profile}
            viewMode={viewMode}
            cardStyle={profile.cardStyle}
            cardColors={profile.cardColors}
            style={{ flex: 1 }}
            cardModules={modules}
            onLayout={onScrollViewLayout}
            ref={scrollRefCallback}
            contentContainerStyle={transformedContentContainerStyle}
            onModuleLayout={onEditedModuleLayout}
          />
        </View>
      </View>
    </View>
  );
};

export default WebCardModulePreview;
