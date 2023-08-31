import { omit } from 'lodash';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  BLOCK_TEXT_DEFAULT_VALUES,
  BLOCK_TEXT_MAX_LENGTH,
  BLOCK_TEXT_STYLE_VALUES,
  MODULE_KIND_BLOCK_TEXT,
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
import BlockTextEditionBottomMenu from './BlockTextEditionBottomMenu';
import BlockTextMarginsEditionPanel from './BlockTextMarginsEditionPanel';
import BlockTextPreview from './BlockTextPreview';
import BlockTextSectionBackgroundEditionPanel from './BlockTextSectionBackgroundEditionPanel';
import BlockTextSettingsEditionPanel from './BlockTextSettingsEditionPanel';
import BlockTextTextBackgroundEditionPanel from './BlockTextTextBackgroundEditionPanel';
import type { BlockTextEditionScreen_module$key } from '@azzapp/relay/artifacts/BlockTextEditionScreen_module.graphql';
import type { BlockTextEditionScreen_viewer$key } from '@azzapp/relay/artifacts/BlockTextEditionScreen_viewer.graphql';
import type {
  BlockTextEditionScreenUpdateModuleMutation,
  SaveBlockTextModuleInput,
} from '@azzapp/relay/artifacts/BlockTextEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';

export type BlockTextEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  viewer: BlockTextEditionScreen_viewer$key;
  /**
   * the current module to edit, if null, a new module will be created
   */
  module: BlockTextEditionScreen_module$key | null;
};

/**
 * A component that allows to create or update the BlockText Webcard module.
 */
const BlockTextEditionScreen = ({
  module,
  viewer: viewerKey,
}: BlockTextEditionScreenProps) => {
  // #region Data retrieval
  const blockText = useFragment(
    graphql`
      fragment BlockTextEditionScreen_module on CardModuleBlockText {
        id
        text
        fontFamily
        fontColor
        textAlign
        fontSize
        verticalSpacing
        textMarginVertical
        textMarginHorizontal
        marginHorizontal
        marginVertical
        textBackground {
          id
          uri
        }
        textBackgroundStyle {
          backgroundColor
          patternColor
          opacity
        }
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
    `,
    module,
  );

  const viewer = useFragment(
    graphql`
      fragment BlockTextEditionScreen_viewer on Viewer {
        ...BlockTextSettingsEditionPanel_viewer
        ...BlockTextSectionBackgroundEditionPanel_viewer
        ...BlockTextTextBackgroundEditionPanel_viewer
        moduleBackgrounds {
          id
          uri
          resizeMode
        }
        profile {
          cardColors {
            primary
            light
            dark
          }
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
        }
      }
    `,
    viewerKey,
  );

  // #endregion

  // #region Data edition
  const initialValue = useMemo(() => {
    return {
      text: blockText?.text ?? null,
      fontFamily: blockText?.fontFamily ?? null,
      fontColor: blockText?.fontColor ?? null,
      textAlign: blockText?.textAlign ?? null,
      fontSize: blockText?.fontSize ?? null,
      verticalSpacing: blockText?.verticalSpacing ?? null,
      textMarginVertical: blockText?.textMarginVertical ?? null,
      textMarginHorizontal: blockText?.textMarginHorizontal ?? null,
      marginHorizontal: blockText?.marginHorizontal ?? null,
      marginVertical: blockText?.marginVertical ?? null,
      textBackgroundId: blockText?.textBackground?.id ?? null,
      textBackgroundStyle: blockText?.textBackgroundStyle ?? null,
      backgroundId: blockText?.background?.id ?? null,
      backgroundStyle: blockText?.backgroundStyle ?? null,
    };
  }, [blockText]);

  const { data, value, fieldUpdateHandler, dirty } = useModuleDataEditor({
    initialValue,
    cardStyle: viewer.profile?.cardStyle,
    styleValuesMap: BLOCK_TEXT_STYLE_VALUES,
    defaultValues: BLOCK_TEXT_DEFAULT_VALUES,
  });

  const {
    text,
    fontFamily,
    fontColor,
    textAlign,
    fontSize,
    verticalSpacing,
    textMarginVertical,
    textMarginHorizontal,
    marginHorizontal,
    marginVertical,
    textBackgroundId,
    textBackgroundStyle,
    backgroundId,
    backgroundStyle,
  } = data;

  const previewData = {
    ...omit(data, 'backgroundId', 'textBackgroundId'),
    background:
      viewer.moduleBackgrounds.find(
        background => background.id === backgroundId,
      ) ?? null,
    textBackground:
      viewer.moduleBackgrounds.find(
        background => background.id === textBackgroundId,
      ) ?? null,
  };
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<BlockTextEditionScreenUpdateModuleMutation>(graphql`
      mutation BlockTextEditionScreenUpdateModuleMutation(
        $input: SaveBlockTextModuleInput!
      ) {
        saveBlockTextModule(input: $input) {
          profile {
            id
            cardModules {
              kind
              visible
              ...BlockTextEditionScreen_module
            }
          }
        }
      }
    `);
  const isValid = true; //TODO:
  const canSave = dirty && isValid && !saving;

  const router = useRouter();

  const onSave = useCallback(async () => {
    if (!canSave) {
      return;
    }

    const input: SaveBlockTextModuleInput = {
      ...value,
      moduleId: blockText?.id,
      text: value.text!,
    };

    commit({
      variables: {
        input,
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
  }, [canSave, blockText?.id, value, commit, router]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  // #endregion

  // #region Fields edition handlers

  const onTextChange = fieldUpdateHandler('text');

  const onFontFamilyChange = fieldUpdateHandler('fontFamily');

  const onFontColorChange = fieldUpdateHandler('fontColor');

  const onTextAlignChange = fieldUpdateHandler('textAlign');

  const onFontSizeChange = fieldUpdateHandler('fontSize');

  const onVerticalSpacingChange = fieldUpdateHandler('verticalSpacing');

  const onTextMarginVerticalChange = fieldUpdateHandler('textMarginVertical');

  const onTextMarginHorizontalChange = fieldUpdateHandler(
    'textMarginHorizontal',
  );

  const onMarginHorizontalChange = fieldUpdateHandler('marginHorizontal');

  const onMarginVerticalChange = fieldUpdateHandler('marginVertical');

  const onTextBackgroundChange = fieldUpdateHandler('textBackgroundId');

  const onTextBackgroundStyleChange = fieldUpdateHandler('textBackgroundStyle');

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');

  // #endregion

  // #region tabs

  const [showContentModal, setShowContentModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('settings');

  const onCloseContentModal = useCallback(() => {
    setShowContentModal(false);
  }, []);

  const onCurrentTabChange = useCallback(
    (currentTab: string) => {
      if (currentTab === 'editor') {
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

  const onPreviewPress = useCallback(() => {
    setShowContentModal(true);
  }, []);

  return (
    <Container style={[styles.root, { paddingTop: insetTop }]}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Text Block',
          description: 'BlockText text screen title',
        })}
        leftElement={
          <HeaderButton
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Cancel button label in Block Text module screen',
            })}
          />
        }
        rightElement={
          <HeaderButton
            disabled={!canSave}
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Save button label in Block Text module screen',
            })}
          />
        }
      />
      <BlockTextPreview
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
            id: 'settings',
            element: (
              <BlockTextSettingsEditionPanel
                viewer={viewer}
                fontFamily={fontFamily}
                onFontFamilyChange={onFontFamilyChange}
                fontColor={fontColor}
                onFontColorChange={onFontColorChange}
                textAlign={textAlign}
                onTextAlignChange={onTextAlignChange}
                fontSize={fontSize}
                onFontSizeChange={onFontSizeChange}
                verticalSpacing={verticalSpacing}
                onVerticalSpacingChange={onVerticalSpacingChange}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
                bottomSheetHeight={bottomPanelHeight}
              />
            ),
          },
          {
            id: 'margins',
            element: (
              <BlockTextMarginsEditionPanel
                textMarginVertical={textMarginVertical}
                onTextMarginVerticalChange={onTextMarginVerticalChange}
                textMarginHorizontal={textMarginHorizontal}
                onTextMarginHorizontalChange={onTextMarginHorizontalChange}
                marginHorizontal={marginHorizontal}
                onMarginHorizontalChange={onMarginHorizontalChange}
                marginVertical={marginVertical}
                onMarginVerticalChange={onMarginVerticalChange}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
              />
            ),
          },
          {
            id: 'textBackground',
            element: (
              <BlockTextTextBackgroundEditionPanel
                viewer={viewer}
                textBackgroundId={textBackgroundId}
                textBackgroundStyle={textBackgroundStyle}
                onTextBackgroundChange={onTextBackgroundChange}
                onTextBackgroundStyleChange={onTextBackgroundStyleChange}
                bottomSheetHeight={bottomPanelHeight}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
              />
            ),
          },
          {
            id: 'sectionBackground',
            element: (
              <BlockTextSectionBackgroundEditionPanel
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
            editedModuleId={blockText?.id}
            visible={currentTab === 'preview'}
            editedModuleInfo={{
              kind: MODULE_KIND_BLOCK_TEXT,
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
      <BlockTextEditionBottomMenu
        currentTab={currentTab}
        onItemPress={onCurrentTabChange}
        style={[
          styles.tabsBar,
          { bottom: insetBottom, width: windowWidth - 20 },
        ]}
      />
      <TextAreaModal
        visible={showContentModal}
        value={text ?? ''}
        placeholder={intl.formatMessage({
          defaultMessage: 'Enter text',
          description:
            'Placeholder for text area in simple text edition screen',
        })}
        maxLength={BLOCK_TEXT_MAX_LENGTH}
        onClose={onCloseContentModal}
        onChangeText={onTextChange}
      />
    </Container>
  );
};

export default BlockTextEditionScreen;

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
