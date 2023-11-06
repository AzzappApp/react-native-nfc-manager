import { useRef, useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import Container from '#ui/Container';
import { TAB_BAR_HEIGHT } from '#ui/TabsBar';
import TitleWithLine from '#ui/TitleWithLine';
import { useModulesData } from './cardModules/ModuleData';
import WebCardPreview from './WebCardPreview';
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
   * height of the preview.
   */
  height: number;
  /**
   * contentContainer padding bottom of the preview scrollView.
   */
  contentPaddingBottom: number;
  /**
   * Does the preview is visible.
   */
  visible: boolean;
};

/**
 * Render a preview of a web card by replacing or adding a module.
 */
const WebCardModulePreview = ({
  editedModuleInfo,
  editedModuleId,
  visible,
  height,
  contentPaddingBottom,
  style,
  ...props
}: WebCardModulePreviewProps) => {
  const {
    viewer: { profile },
  } = useLazyLoadQuery<WebCardModulePreviewQuery>(
    graphql`
      query WebCardModulePreviewQuery {
        viewer {
          profile {
            webCard {
              id
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
              ...CoverRenderer_webCard
              ...WebCardBackgroundPreview_webCard
              ...WebCardBackground_webCard
            }
          }
        }
      }
    `,
    {},
  );

  const cardModules = useModulesData(profile?.webCard?.cardModules ?? [], true);

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
        }
        return module;
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

  const previewHeight = height - TAB_BAR_HEIGHT - 16;

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
      </Container>
      <Container>
        <WebCardPreview
          webCard={profile.webCard}
          cardStyle={profile.webCard.cardStyle}
          cardColors={profile.webCard.cardColors}
          height={previewHeight}
          cardModules={modules}
          onLayout={onScrollViewLayout}
          ref={scrollRefCallback}
          onModuleLayout={onEditedModuleLayout}
          contentPaddingBottom={contentPaddingBottom}
        />
      </Container>
    </View>
  );
};

export default WebCardModulePreview;
