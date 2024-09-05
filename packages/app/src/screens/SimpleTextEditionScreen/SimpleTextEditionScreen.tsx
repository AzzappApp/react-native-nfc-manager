import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  SIMPLE_TEXT_DEFAULT_VALUES,
  SIMPLE_TITLE_DEFAULT_VALUES,
  SIMPLE_TEXT_MAX_LENGTH,
  SIMPLE_TITLE_MAX_LENGTH,
  SIMPLE_TEXT_STYLE_VALUES,
  SIMPLE_TITLE_STYLE_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import { changeModuleRequireSubscription } from '@azzapp/shared/subscriptionHelpers';
import { useRouter } from '#components/NativeRouter';
import useEditorLayout from '#hooks/useEditorLayout';
import useHandleProfileActionError from '#hooks/useHandleProfileError';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import { type SimpleTextEditionScreenUpdateModuleMutation } from '#relayArtifacts/SimpleTextEditionScreenUpdateModuleMutation.graphql';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import ModuleEditionScreenTitle from '#ui/ModuleEditionScreenTitle';
import TabView from '#ui/TabView';
import TextAreaModal from '#ui/TextAreaModal';
import SimpleTextEditionBackgroundPanel from './SimpleTextEditionBackgroundPanel';
import SimpleTextEditionBottomMenu from './SimpleTextEditionBottomMenu';
import SimpleTextMarginEditionPanel from './SimpleTextMarginsEditionPanel';
import SimpleTextPreview from './SimpleTextPreview';
import SimpleTextStyleEditionPanel from './SimpleTextStyleEditionPanel';
import type { SimpleTextEditionScreen_module$key } from '#relayArtifacts/SimpleTextEditionScreen_module.graphql';
import type { SimpleTextEditionScreen_profile$key } from '#relayArtifacts/SimpleTextEditionScreen_profile.graphql';
import type { ViewProps } from 'react-native';

export type SimpleTextEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  profile: SimpleTextEditionScreen_profile$key;
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
  profile: profileKey,
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

  const profile = useFragment(
    graphql`
      fragment SimpleTextEditionScreen_profile on Profile {
        webCard {
          id
          cardIsPublished
          isPremium
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
          cardModules {
            id
          }
          ...WebCardColorPicker_webCard
          ...SimpleTextStyleEditionPanel_webCard
        }
        moduleBackgrounds {
          id
          uri
          resizeMode
        }
        ...SimpleTextEditionBackgroundPanel_profile
      }
    `,
    profileKey,
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
    cardStyle: profile?.webCard?.cardStyle,
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
    fontFamily,
    backgroundId,
    backgroundStyle,
  } = data;

  const previewData = useMemo(
    () => ({
      text,
      textAlign,
      fontColor,
      fontFamily,
      backgroundStyle,
      kind: moduleKind,
      background:
        profile.moduleBackgrounds.find(
          background => background.id === backgroundId,
        ) ?? null,
    }),
    [
      backgroundId,
      backgroundStyle,
      fontColor,
      fontFamily,
      moduleKind,
      profile.moduleBackgrounds,
      text,
      textAlign,
    ],
  );
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<SimpleTextEditionScreenUpdateModuleMutation>(graphql`
      mutation SimpleTextEditionScreenUpdateModuleMutation(
        $webCardId: ID!
        $input: SaveSimpleTextModuleInput!
      ) {
        saveSimpleTextModule(webCardId: $webCardId, input: $input) {
          webCard {
            id
            requiresSubscription
            cardModules {
              visible
              ...SimpleTextEditionScreen_module
              ...SimpleTextRenderer_simpleTextModule
              ...SimpleTextRenderer_simpleTitleModule
            }
          }
        }
      }
    `);

  const isValid = !!text;

  const [touched, setTouched] = useState(false);

  const onTouched = useCallback(() => {
    setTouched(true);
  }, []);

  const canSave = (dirty || touched) && isValid && !saving;

  const router = useRouter();
  const intl = useIntl();

  const onCancel = router.back;

  const cardModulesCount =
    (profile.webCard?.cardModules.length ?? 0) + (moduleData ? 0 : 1);

  const handleProfileActionError = useHandleProfileActionError(
    intl.formatMessage({
      defaultMessage: 'Error, could not save your module',
      description: 'Error toast when saving a module',
    }) as string,
  );
  // #endregion

  // #region Fields edition handlers
  const onTextChange = fieldUpdateHandler('text');

  const onColorChange = fieldUpdateHandler('fontColor');

  const fontSize = useSharedValue(data.fontSize ?? 12);

  const onFontFamilyChange = fieldUpdateHandler('fontFamily');

  const onTextAlignChange = fieldUpdateHandler('textAlign');

  const verticalSpacing = useSharedValue(data.verticalSpacing ?? null);

  const marginHorizontal = useSharedValue(data.marginHorizontal ?? null);

  const marginVertical = useSharedValue(data.marginVertical ?? null);

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');

  const onSave = useCallback(() => {
    if (!canSave || !profile.webCard) {
      return;
    }

    const requireSubscription = changeModuleRequireSubscription(
      moduleKind,
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

    commit({
      variables: {
        webCardId: profile.webCard?.id,
        input: {
          ...value,
          fontSize: fontSize.value,
          verticalSpacing: verticalSpacing.value,
          marginHorizontal: marginHorizontal.value,
          marginVertical: marginVertical.value,
          moduleId: moduleData?.id ?? null,
          kind: moduleKind,
          text: value.text!,
        },
      },
      onCompleted() {
        router.back();
      },
      onError(e) {
        console.error(e);
        handleProfileActionError(e);
      },
    });
  }, [
    canSave,
    profile.webCard,
    moduleKind,
    cardModulesCount,
    commit,
    value,
    fontSize.value,
    verticalSpacing.value,
    marginHorizontal.value,
    marginVertical.value,
    moduleData?.id,
    router,
    handleProfileActionError,
  ]);

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

  const middleElement = (
    <ModuleEditionScreenTitle
      label={
        moduleKind === 'simpleText'
          ? intl.formatMessage({
              defaultMessage: 'Simple text',
              description: 'Simple text screen title',
            })
          : intl.formatMessage({
              defaultMessage: 'Simple title',
              description: 'Simple title screen title',
            })
      }
      kind={moduleKind}
      moduleCount={cardModulesCount}
    />
  );

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
        animatedData={{
          fontSize,
          verticalSpacing,
          marginHorizontal,
          marginVertical,
        }}
        onPreviewPress={onPreviewPress}
        colorPalette={profile?.webCard?.cardColors}
        cardStyle={profile?.webCard?.cardStyle}
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
                webCard={profile?.webCard ?? null}
                fontColor={fontColor ?? '#000'}
                fontFamily={fontFamily ?? 'Arial'}
                fontSize={fontSize}
                textAlignment={textAlign ?? 'left'}
                verticalSpacing={verticalSpacing}
                onColorChange={onColorChange}
                onFontFamilyChange={onFontFamilyChange}
                onTextAlignmentChange={onTextAlignChange}
                bottomSheetHeight={bottomPanelHeight}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
                onTouched={onTouched}
              />
            ),
          },
          {
            id: 'margins',
            element: (
              <SimpleTextMarginEditionPanel
                moduleKind={moduleKind}
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
            id: 'background',
            element: (
              <SimpleTextEditionBackgroundPanel
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
      <TextAreaModal
        visible={showContentModal}
        value={text ?? ''}
        placeholder={intl.formatMessage({
          defaultMessage: 'Enter text',
          description:
            'Placeholder for text area in simple text edition screen',
        })}
        headerTitle={intl.formatMessage({
          defaultMessage: 'Edit text',
          description:
            'Title for text area header modal in simple text edition screen',
        })}
        maxLength={
          moduleKind === 'simpleText'
            ? SIMPLE_TEXT_MAX_LENGTH
            : SIMPLE_TITLE_MAX_LENGTH
        }
        onClose={onCloseContentModal}
        onChangeText={text => {
          onTextChange(text);
          onCloseContentModal();
        }}
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
