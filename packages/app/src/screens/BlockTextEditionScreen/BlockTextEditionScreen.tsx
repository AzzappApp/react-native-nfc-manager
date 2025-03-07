import omit from 'lodash/omit';
import { startTransition, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Platform, StyleSheet, View } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment, useMutation } from 'react-relay';

import {
  BLOCK_TEXT_DEFAULT_VALUES,
  BLOCK_TEXT_MAX_LENGTH,
  BLOCK_TEXT_STYLE_VALUES,
  getBlockTextDefaultColors,
} from '@azzapp/shared/cardModuleHelpers';
import { changeModuleRequireSubscription } from '@azzapp/shared/subscriptionHelpers';
import AnimatedDataOverride from '#components/AnimatedDataOverride';
import { useRouter } from '#components/NativeRouter';
import useEditorLayout from '#hooks/useEditorLayout';
import useHandleProfileActionError from '#hooks/useHandleProfileError';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import { BOTTOM_MENU_HEIGHT, BOTTOM_MENU_PADDING } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import ModuleEditionScreenTitle from '#ui/ModuleEditionScreenTitle';
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
          cardIsPublished
          coverBackgroundColor
          isPremium
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
          cardModules {
            id
          }
          ...BlockTextSettingsEditionPanel_webCard
          ...ModuleEditionScreenTitle_webCard
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
      ...getBlockTextDefaultColors(
        profile.webCard?.coverBackgroundColor,
        blockText,
      ),
    };
  }, [blockText, profile.webCard?.coverBackgroundColor]);

  const { data, value, fieldUpdateHandler, dirty } = useModuleDataEditor({
    initialValue,
    cardStyle: profile?.webCard?.cardStyle,
    styleValuesMap: BLOCK_TEXT_STYLE_VALUES,
    defaultValues: BLOCK_TEXT_DEFAULT_VALUES,
  });

  const {
    text,
    fontFamily,
    fontColor,
    textAlign,
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
        $webCardId: ID!
        $input: SaveBlockTextModuleInput!
      ) {
        saveBlockTextModule(webCardId: $webCardId, input: $input) {
          webCard {
            id
            requiresSubscription
            cardModules {
              id
              kind
              visible
              variant
              ...BlockTextEditionScreen_module
            }
          }
        }
      }
    `);
  const isValid = true; //TODO:

  const [touched, setTouched] = useState(false);

  const onTouched = useCallback(() => {
    setTouched(true);
  }, []);

  const canSave = (dirty || touched) && isValid && !saving;

  const router = useRouter();

  const intl = useIntl();

  const cardModulesCount =
    (profile.webCard?.cardModules.length ?? 0) + (blockText ? 0 : 1);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleProfileActionError = useHandleProfileActionError(
    intl.formatMessage({
      defaultMessage: 'Could not save your block text module, an error occured',
      description:
        'Error toast message when saving a block text module failed for an unknown reason.',
    }) as string,
  );
  // #endregion

  // #region Fields edition handlers

  const onTextChange = fieldUpdateHandler('text');

  const onFontFamilyChange = fieldUpdateHandler('fontFamily');

  const onFontColorChange = fieldUpdateHandler('fontColor');

  const onTextAlignChange = fieldUpdateHandler('textAlign');

  const fontSize = useSharedValue(data.fontSize ?? null);

  const verticalSpacing = useSharedValue(
    data.verticalSpacing ?? BLOCK_TEXT_DEFAULT_VALUES.verticalSpacing,
  );

  const textMarginVertical = useSharedValue(
    data.textMarginVertical ?? BLOCK_TEXT_DEFAULT_VALUES.textMarginVertical,
  );

  const textMarginHorizontal = useSharedValue(
    data.textMarginHorizontal ?? BLOCK_TEXT_DEFAULT_VALUES.textMarginHorizontal,
  );

  const marginHorizontal = useSharedValue(
    data.marginHorizontal ?? BLOCK_TEXT_DEFAULT_VALUES.marginHorizontal,
  );

  const marginVertical = useSharedValue(
    data.marginVertical ?? BLOCK_TEXT_DEFAULT_VALUES.marginVertical,
  );

  const animatedData = useDerivedValue(() => ({
    fontSize: fontSize.value,
    verticalSpacing: verticalSpacing.value,
    textMarginVertical: textMarginVertical.value,
    textMarginHorizontal: textMarginHorizontal.value,
    marginHorizontal: marginHorizontal.value,
    marginVertical: marginVertical.value,
  }));

  const onTextBackgroundChange = fieldUpdateHandler('textBackgroundId');

  const onTextBackgroundStyleChange = fieldUpdateHandler('textBackgroundStyle');

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');

  const onSave = useCallback(async () => {
    if (!canSave || !profile.webCard?.id) {
      return;
    }

    const requireSubscription = changeModuleRequireSubscription(
      'blockText',
      cardModulesCount,
    );

    if (
      profile.webCard?.cardIsPublished &&
      requireSubscription &&
      !profile.webCard?.isPremium
    ) {
      router.push({ route: 'USER_PAY_WALL' });
      return;
    }

    const input: SaveBlockTextModuleInput = {
      ...value,
      moduleId: blockText?.id,
      text: value.text!,
      textMarginHorizontal: textMarginHorizontal.value,
      textMarginVertical: textMarginVertical.value,
      marginHorizontal: marginHorizontal.value,
      marginVertical: marginVertical.value,
      fontSize: fontSize.value,
      verticalSpacing: verticalSpacing.value,
    };

    commit({
      variables: {
        webCardId: profile.webCard?.id,
        input,
      },
      onCompleted() {
        if (module) {
          router.pop(1);
        } else {
          router.pop(2);
        }
      },
      onError(e) {
        console.error(e);
        handleProfileActionError(e);
      },
    });
  }, [
    canSave,
    profile.webCard?.id,
    profile.webCard?.cardIsPublished,
    profile.webCard?.isPremium,
    cardModulesCount,
    value,
    blockText?.id,
    textMarginHorizontal,
    textMarginVertical,
    marginHorizontal,
    marginVertical,
    fontSize,
    verticalSpacing,
    commit,
    router,
    module,
    handleProfileActionError,
  ]);

  // #endregion

  // #region tabs

  const [showContentModal, setShowContentModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('settings');

  const onCloseContentModal = useCallback(() => {
    setShowContentModal(false);
  }, []);

  const onCurrentTabChange = useCallback(
    (currentTab: string) => {
      startTransition(() => {
        if (currentTab === 'editor') {
          setShowContentModal(true);
        } else {
          setCurrentTab(currentTab);
        }
      });
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
        middleElement={
          <ModuleEditionScreenTitle
            label={intl.formatMessage({
              defaultMessage: 'Text Block',
              description: 'BlockText text screen title',
            })}
            kind="blockText"
            moduleCount={cardModulesCount}
            webCardKey={profile.webCard}
          />
        }
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
      <AnimatedDataOverride data={previewData} animatedData={animatedData}>
        {data => (
          <BlockTextPreview
            style={{ height: topPanelHeight - 20, marginVertical: 10 }}
            data={data}
            onPreviewPress={onPreviewPress}
            colorPalette={profile?.webCard?.cardColors}
            cardStyle={profile?.webCard?.cardStyle}
          />
        )}
      </AnimatedDataOverride>
      <TabView
        style={{
          height: bottomPanelHeight,
          flex: 1,
        }}
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
                verticalSpacing={verticalSpacing}
                style={{
                  flex: 1,
                  marginBottom:
                    BOTTOM_MENU_HEIGHT + (Platform.OS === 'android' ? 15 : 0),
                }}
                bottomSheetHeight={bottomPanelHeight}
                onTouched={onTouched}
              />
            ),
          },
          {
            id: 'margins',
            element: (
              <BlockTextMarginsEditionPanel
                textMarginVertical={textMarginVertical}
                textMarginHorizontal={textMarginHorizontal}
                marginHorizontal={marginHorizontal}
                marginVertical={marginVertical}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
                onTouched={onTouched}
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
                  marginBottom:
                    BOTTOM_MENU_HEIGHT + (Platform.OS === 'android' ? 15 : 0),
                }}
                onTouched={onTouched}
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
                  marginBottom: BOTTOM_MENU_HEIGHT,
                }}
              />
            ),
          },
        ]}
      />
      <View
        style={[styles.tabsBar, { bottom: insetBottom - BOTTOM_MENU_PADDING }]}
      >
        <BlockTextEditionBottomMenu
          currentTab={currentTab}
          onItemPress={onCurrentTabChange}
          style={{ width: windowWidth - 20 }}
        />
      </View>
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
        onChangeText={text => {
          onTextChange(text);
          onCloseContentModal();
        }}
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
    left: 0,
    right: 0,
  },
});
