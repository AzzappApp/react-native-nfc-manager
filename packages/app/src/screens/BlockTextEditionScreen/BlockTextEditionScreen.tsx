import { omit } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';

import {
  BLOCK_TEXT_DEFAULT_VALUES,
  BLOCK_TEXT_MAX_LENGTH,
  BLOCK_TEXT_STYLE_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import { useRouter } from '#components/NativeRouter';
import useEditorLayout from '#hooks/useEditorLayout';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import TabView from '#ui/TabView';
import TextAreaModal from '#ui/TextAreaModal';
import BlockTextEditionBottomMenu from './BlockTextEditionBottomMenu';
import BlockTextMarginsEditionPanel from './BlockTextMarginsEditionPanel';
import BlockTextPreview from './BlockTextPreview';
import BlockTextSectionBackgroundEditionPanel from './BlockTextSectionBackgroundEditionPanel';
import BlockTextSettingsEditionPanel from './BlockTextSettingsEditionPanel';
import BlockTextTextBackgroundEditionPanel from './BlockTextTextBackgroundEditionPanel';
import type { BlockTextEditionScreen_module$key } from '#relayArtifacts/BlockTextEditionScreen_module.graphql';
import type { BlockTextEditionScreen_profile$key } from '#relayArtifacts/BlockTextEditionScreen_profile.graphql';
import type {
  BlockTextEditionScreenUpdateModuleMutation,
  SaveBlockTextModuleInput,
} from '#relayArtifacts/BlockTextEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';

export type BlockTextEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  profile: BlockTextEditionScreen_profile$key;
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
  profile: profileKey,
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

  const profile = useFragment(
    graphql`
      fragment BlockTextEditionScreen_profile on Profile {
        moduleBackgrounds {
          id
          uri
          resizeMode
        }
        webCard {
          id
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
          ...BlockTextSettingsEditionPanel_webCard
        }
        ...BlockTextSectionBackgroundEditionPanel_profile
        ...BlockTextTextBackgroundEditionPanel_profile
      }
    `,
    profileKey,
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
    cardStyle: profile?.webCard.cardStyle,
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
      profile.moduleBackgrounds.find(
        background => background.id === backgroundId,
      ) ?? null,
    textBackground:
      profile.moduleBackgrounds.find(
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
          webCard {
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

  const intl = useIntl();

  const onSave = useCallback(async () => {
    if (!canSave) {
      return;
    }

    const input: SaveBlockTextModuleInput = {
      ...value,
      moduleId: blockText?.id,
      text: value.text!,
      webCardId: profile.webCard.id,
    };

    commit({
      variables: {
        input,
      },
      onCompleted() {
        router.back();
      },
      onError(e) {
        console.error(e);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Could not save your block text module, an error occured',
            description:
              'Error toast message when saving a block text module failed for an unknown reason.',
          }),
        });
      },
    });
  }, [canSave, value, blockText?.id, profile.webCard.id, commit, router, intl]);

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
        colorPalette={profile?.webCard.cardColors}
        cardStyle={profile?.webCard.cardStyle}
      />
      <TabView
        style={{ height: bottomPanelHeight }}
        currentTab={currentTab}
        tabs={[
          {
            id: 'settings',
            element: (
              <BlockTextSettingsEditionPanel
                webCard={profile?.webCard ?? null}
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
                profile={profile}
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
                profile={profile}
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
        headerTitle={intl.formatMessage({
          defaultMessage: 'Edit text',
          description:
            'Title for text area header modal in block text edition screen',
        })}
        placeholder={intl.formatMessage({
          defaultMessage: 'Enter text',
          description: 'Placeholder for text area in block text edition screen',
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
