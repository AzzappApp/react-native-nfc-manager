import { omit } from 'lodash';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { type SimpleTextEditionScreenUpdateModuleMutation } from '@azzapp/relay/artifacts/SimpleTextEditionScreenUpdateModuleMutation.graphql';
import {
  SIMPLE_TEXT_DEFAULT_VALUES,
  SIMPLE_TITLE_DEFAULT_VALUES,
  SIMPLE_TEXT_MAX_LENGTH,
  SIMPLE_TITLE_MAX_LENGTH,
  SIMPLE_TEXT_STYLE_VALUES,
  SIMPLE_TITLE_STYLE_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import { useRouter } from '#components/NativeRouter';
import WebCardModulePreview from '#components/WebCardModulePreview';
import { GraphQLError } from '#helpers/relayEnvironment';
import useEditorLayout from '#hooks/useEditorLayout';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import TabView from '#ui/TabView';
import TextAreaModal from '#ui/TextAreaModal';
import SimpleTextEditionBackgroundPanel from './SimpleTextEditionBackgroundPanel';
import SimpleTextEditionBottomMenu from './SimpleTextEditionBottomMenu';
import SimpleTextMarginEditionPanel from './SimpleTextMarginsEditionPanel';
import SimpleTextPreview from './SimpleTextPreview';
import SimpleTextStyleEditionPanel from './SimpleTextStyleEditionPanel';
import type { SimpleTextEditionScreen_module$key } from '@azzapp/relay/artifacts/SimpleTextEditionScreen_module.graphql';
import type { SimpleTextEditionScreen_viewer$key } from '@azzapp/relay/artifacts/SimpleTextEditionScreen_viewer.graphql';
import type { ViewProps } from 'react-native';

export type SimpleTextEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  viewer: SimpleTextEditionScreen_viewer$key;
  /**
   * the current module to edit, if null, a new module will be created
   */
  module: SimpleTextEditionScreen_module$key | null;
  /**
   * The current module kind edited, can be simpleText or simpleTitle
   */
  moduleKind: 'simpleText' | 'simpleTitle';
};

/**
 * A component that allows to create or update the SimpleText Webcard module.
 */
const SimpleTextEditionScreen = ({
  module,
  viewer: viewerKey,
  moduleKind,
}: SimpleTextEditionScreenProps) => {
  // #region Data retrieval
  const moduleData = useFragment(
    graphql`
      fragment SimpleTextEditionScreen_module on CardModule {
        id
        ... on CardModuleSimpleText @alias(as: "simpleText") {
          text
          textAlign
          fontColor
          fontSize
          fontFamily
          verticalSpacing
          marginHorizontal
          marginVertical
          background {
            id
            uri
            resizeMode
          }
          backgroundStyle {
            backgroundColor
            patternColor
          }
        }
        ... on CardModuleSimpleTitle @alias(as: "simpleTitle") {
          text
          textAlign
          fontColor
          fontSize
          fontFamily
          verticalSpacing
          marginHorizontal
          marginVertical
          background {
            id
            uri
            resizeMode
          }
          backgroundStyle {
            backgroundColor
            patternColor
          }
        }
      }
    `,
    module,
  );

  if (
    moduleData?.id &&
    ((moduleKind === 'simpleText' && !moduleData.simpleText == null) ||
      (moduleKind === 'simpleTitle' && !moduleData.simpleTitle == null))
  ) {
    // TODO error ?
  }

  const viewer = useFragment(
    graphql`
      fragment SimpleTextEditionScreen_viewer on Viewer {
        ...SimpleTextEditionBackgroundPanel_viewer
        ...SimpleTextStyleEditionPanel_viewer
        profile {
          ...ProfileColorPicker_profile
          cardStyle {
            borderColor
            borderRadius
            borderWidth
            buttonColor
            buttonRadius
            fontFamily
            fontSize
            gap
            titleFontFamily
            titleFontSize
          }
          cardColors {
            primary
            light
            dark
          }
        }
        moduleBackgrounds {
          id
          uri
          resizeMode
        }
      }
    `,
    viewerKey,
  );
  // #endregion

  // #region Data edition
  const initialValue = useMemo(() => {
    const data = moduleData?.simpleText ?? moduleData?.simpleTitle;
    return {
      backgroundId: data?.background?.id ?? null,
      backgroundStyle: data?.backgroundStyle ?? null,
      fontColor: data?.fontColor ?? null,
      fontFamily: data?.fontFamily ?? null,
      fontSize: data?.fontSize ?? null,
      marginHorizontal: data?.marginHorizontal ?? null,
      marginVertical: data?.marginVertical ?? null,
      moduleId: moduleData?.id ?? null,
      text: data?.text ?? null,
      textAlign: data?.textAlign ?? null,
      verticalSpacing: data?.verticalSpacing ?? null,
    };
  }, [moduleData]);

  const { data, value, fieldUpdateHandler, dirty } = useModuleDataEditor({
    initialValue,
    cardStyle: viewer.profile?.cardStyle,
    styleValuesMap:
      moduleKind === 'simpleText'
        ? SIMPLE_TEXT_STYLE_VALUES
        : SIMPLE_TITLE_STYLE_VALUES,
    defaultValues:
      moduleKind === 'simpleText'
        ? SIMPLE_TEXT_DEFAULT_VALUES
        : SIMPLE_TITLE_DEFAULT_VALUES,
  });

  const {
    text,
    textAlign,
    fontColor,
    fontSize,
    fontFamily,
    verticalSpacing,
    marginHorizontal,
    marginVertical,
    backgroundId,
    backgroundStyle,
  } = data;

  const previewData = {
    ...omit(data, 'backgroundId'),
    kind: moduleKind,
    background:
      viewer.moduleBackgrounds.find(
        background => background.id === backgroundId,
      ) ?? null,
  };
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<SimpleTextEditionScreenUpdateModuleMutation>(graphql`
      mutation SimpleTextEditionScreenUpdateModuleMutation(
        $input: SaveSimpleTextModuleInput!
      ) {
        saveSimpleTextModule(input: $input) {
          profile {
            id
            cardModules {
              visible
              ...SimpleTextEditionScreen_module
            }
          }
        }
      }
    `);

  const isValid = !!text;
  const canSave = dirty && isValid && !saving;

  const router = useRouter();
  const onSave = useCallback(() => {
    if (!canSave) {
      return;
    }

    commit({
      variables: {
        input: {
          ...value,
          moduleId: moduleData?.id ?? null,
          kind: moduleKind,
          text: value.text!,
        },
      },
      onCompleted() {
        router.back();
      },
      onError(e) {
        // eslint-disable-next-line no-alert
        // TODO better error handling
        console.log(e);
        if (e instanceof GraphQLError) {
          console.log(e.cause);
        }
      },
    });
  }, [canSave, commit, value, moduleData?.id, moduleKind, router]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);
  // #endregion

  // #region Fields edition handlers
  const onTextChange = fieldUpdateHandler('text');

  const onColorChange = fieldUpdateHandler('fontColor');

  const onFontSizeChange = fieldUpdateHandler('fontSize');

  const onFontFamilyChange = fieldUpdateHandler('fontFamily');

  const onTextAlignChange = fieldUpdateHandler('textAlign');

  const onVerticalSpacingChange = fieldUpdateHandler('verticalSpacing');

  const onMarginHorizontalChange = fieldUpdateHandler('marginHorizontal');

  const onMarginVerticalChange = fieldUpdateHandler('marginVertical');

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');
  // #endregion

  // #region tabs

  const [showContentModal, setShowContentModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('style');

  const onPreviewPress = useCallback(() => {
    setShowContentModal(true);
  }, []);

  const onCloseContentModal = useCallback(() => {
    setShowContentModal(false);
  }, []);

  const onCurrentTabChange = useCallback(
    (currentTab: string) => {
      if (currentTab === 'edit') {
        setShowContentModal(true);
      } else {
        setCurrentTab(currentTab);
      }
    },
    [setCurrentTab],
  );
  // #endregion

  const {
    bottomPanelHeight,
    topPanelHeight,
    insetBottom,
    insetTop,
    windowWidth,
  } = useEditorLayout();

  const intl = useIntl();

  const middleElement =
    moduleKind === 'simpleText'
      ? intl.formatMessage({
          defaultMessage: 'Simple text',
          description: 'Simple text screen title',
        })
      : intl.formatMessage({
          defaultMessage: 'Simple title',
          description: 'Simple title screen title',
        });

  return (
    <Container style={[styles.root, { paddingTop: insetTop }]}>
      <Header
        middleElement={middleElement}
        leftElement={
          <HeaderButton
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Cancel button label in cover edition screen',
            })}
          />
        }
        rightElement={
          <HeaderButton
            disabled={!canSave}
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Save button label in cover edition screen',
            })}
          />
        }
      />
      <SimpleTextPreview
        style={{ height: topPanelHeight - 20, marginVertical: 10 }}
        data={previewData}
        onPreviewPress={onPreviewPress}
        colorPalette={viewer.profile?.cardColors}
        cardStyle={viewer.profile?.cardStyle}
      />
      <TabView
        style={{ height: bottomPanelHeight }}
        currentTab={currentTab}
        tabs={[
          {
            id: 'style',
            element: (
              <SimpleTextStyleEditionPanel
                moduleKind={moduleKind}
                viewer={viewer}
                fontColor={fontColor ?? '#000'}
                fontFamily={fontFamily ?? 'Arial'}
                fontSize={fontSize ?? 12}
                textAlignment={textAlign ?? 'left'}
                verticalSpacing={verticalSpacing ?? 0}
                onColorChange={onColorChange}
                onFontFamilyChange={onFontFamilyChange}
                onFontSizeChange={onFontSizeChange}
                onTextAlignmentChange={onTextAlignChange}
                onVerticalSpacingChange={onVerticalSpacingChange}
                bottomSheetHeight={bottomPanelHeight}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
              />
            ),
          },
          {
            id: 'margins',
            element: (
              <SimpleTextMarginEditionPanel
                marginHorizontal={marginHorizontal ?? 0}
                marginVertical={marginVertical ?? 0}
                onMarginHorizontalChange={onMarginHorizontalChange}
                onMarginVerticalChange={onMarginVerticalChange}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
              />
            ),
          },
          {
            id: 'background',
            element: (
              <SimpleTextEditionBackgroundPanel
                viewer={viewer}
                backgroundId={backgroundId}
                backgroundStyle={backgroundStyle}
                onBackgroundChange={onBackgroundChange}
                onBackgroundStyleChange={onBackgroundStyleChange}
                bottomSheetHeight={bottomPanelHeight}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
              />
            ),
          },
        ]}
      />
      <View
        style={{
          position: 'absolute',
          top: HEADER_HEIGHT + insetTop,
          height: topPanelHeight + bottomPanelHeight,
          width: windowWidth,
          opacity: currentTab === 'preview' ? 1 : 0,
        }}
        pointerEvents={currentTab === 'preview' ? 'auto' : 'none'}
      >
        <Suspense>
          <WebCardModulePreview
            editedModuleId={moduleData?.id}
            visible={currentTab === 'preview'}
            editedModuleInfo={{
              kind: moduleKind,
              data: previewData,
            }}
            style={{
              flex: 1,
            }}
            contentContainerStyle={{
              paddingBottom: insetBottom + BOTTOM_MENU_HEIGHT,
            }}
          />
        </Suspense>
      </View>
      <TextAreaModal
        visible={showContentModal}
        value={text ?? ''}
        placeholder={intl.formatMessage({
          defaultMessage: 'Enter text',
          description:
            'Placeholder for text area in simple text edition screen',
        })}
        maxLength={
          moduleKind === 'simpleText'
            ? SIMPLE_TEXT_MAX_LENGTH
            : SIMPLE_TITLE_MAX_LENGTH
        }
        onClose={onCloseContentModal}
        onChangeText={onTextChange}
      />
      <SimpleTextEditionBottomMenu
        currentTab={currentTab}
        onItemPress={onCurrentTabChange}
        style={[
          styles.tabsBar,
          { bottom: insetBottom, width: windowWidth - 20 },
        ]}
      />
    </Container>
  );
};

export default SimpleTextEditionScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabsBar: {
    position: 'absolute',
    left: 10,
    right: 10,
  },
});
