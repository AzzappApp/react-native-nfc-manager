import { omit } from 'lodash';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  MODULE_KIND_SIMPLE_BUTTON,
  SIMPLE_BUTTON_DEFAULT_VALUES,
  SIMPLE_BUTTON_STYLE_VALUES,
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
import SimpleButtonBackgroundEditionPanel from './SimpleButtonBackgroundEditionPanel';
import SimpleButtonBordersEditionPanel from './SimpleButtonBordersEditionPanel';
import SimpleButtonEditionBottomMenu from './SimpleButtonEditionBottomMenu';
import SimpleButtonMarginsEditionPanel from './SimpleButtonMarginsEditionPanel';
import SimpleButtonPreview from './SimpleButtonPreview';
import SimpleButtonSettingsEditionPanel from './SimpleButtonSettingsEditionPanel';
import type { SimpleButtonEditionScreen_module$key } from '@azzapp/relay/artifacts/SimpleButtonEditionScreen_module.graphql';
import type { SimpleButtonEditionScreen_viewer$key } from '@azzapp/relay/artifacts/SimpleButtonEditionScreen_viewer.graphql';
import type {
  SimpleButtonEditionScreenUpdateModuleMutation,
  SaveSimpleButtonModuleInput,
} from '@azzapp/relay/artifacts/SimpleButtonEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';

export type SimpleButtonEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  viewer: SimpleButtonEditionScreen_viewer$key;
  /**
   * the current module to edit, if null, a new module will be created
   */
  module: SimpleButtonEditionScreen_module$key | null;
};

/**
 * A component that allows to create or update the SimpleButton Webcard module.
 */
const SimpleButtonEditionScreen = ({
  module,
  viewer: viewerKey,
}: SimpleButtonEditionScreenProps) => {
  // #region Data retrieval
  const simpleButton = useFragment(
    graphql`
      fragment SimpleButtonEditionScreen_module on CardModuleSimpleButton {
        id
        buttonLabel
        actionType
        actionLink
        fontFamily
        fontColor
        fontSize
        buttonColor
        borderColor
        borderWidth
        borderRadius
        marginTop
        marginBottom
        width
        height
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
      fragment SimpleButtonEditionScreen_viewer on Viewer {
        ...SimpleButtonSettingsEditionPanel_viewer
        ...SimpleButtonBordersEditionPanel_viewer
        ...SimpleButtonBackgroundEditionPanel_viewer
        moduleBackgrounds {
          id
          uri
          resizeMode
        }
        profile {
          cardColors {
            primary
            dark
            light
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
      buttonLabel: simpleButton?.buttonLabel ?? null,
      actionType: simpleButton?.actionType ?? null,
      actionLink: simpleButton?.actionLink ?? null,
      fontFamily: simpleButton?.fontFamily ?? null,
      fontColor: simpleButton?.fontColor ?? null,
      fontSize: simpleButton?.fontSize ?? null,
      buttonColor: simpleButton?.buttonColor ?? null,
      borderColor: simpleButton?.borderColor ?? null,
      borderWidth: simpleButton?.borderWidth ?? null,
      borderRadius: simpleButton?.borderRadius ?? null,
      marginTop: simpleButton?.marginTop ?? null,
      marginBottom: simpleButton?.marginBottom ?? null,
      width: simpleButton?.width ?? null,
      height: simpleButton?.height ?? null,
      backgroundId: simpleButton?.background?.id ?? null,
      backgroundStyle: simpleButton?.backgroundStyle ?? null,
    };
  }, [simpleButton]);

  const { data, value, fieldUpdateHandler, dirty } = useModuleDataEditor({
    initialValue,
    cardStyle: viewer.profile?.cardStyle,
    styleValuesMap: SIMPLE_BUTTON_STYLE_VALUES,
    defaultValues: SIMPLE_BUTTON_DEFAULT_VALUES,
  });

  const {
    buttonLabel,
    actionType,
    actionLink,
    fontFamily,
    fontColor,
    fontSize,
    buttonColor,
    borderColor,
    borderWidth,
    borderRadius,
    marginTop,
    marginBottom,
    width,
    height,
    backgroundId,
    backgroundStyle,
  } = data;

  const previewData = {
    ...omit(data, 'backgroundId'),
    background:
      viewer.moduleBackgrounds.find(
        background => background.id === backgroundId,
      ) ?? null,
  };
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<SimpleButtonEditionScreenUpdateModuleMutation>(graphql`
      mutation SimpleButtonEditionScreenUpdateModuleMutation(
        $input: SaveSimpleButtonModuleInput!
      ) {
        saveSimpleButtonModule(input: $input) {
          profile {
            id
            cardModules {
              kind
              visible
              ...SimpleButtonEditionScreen_module
            }
          }
        }
      }
    `);
  const isValid =
    !!value.buttonLabel && !!value.actionType && !!value.actionLink;
  const canSave = dirty && isValid && !saving;

  const router = useRouter();
  const onSave = useCallback(async () => {
    if (!canSave) {
      return;
    }

    const input: SaveSimpleButtonModuleInput = {
      ...value,
      moduleId: simpleButton?.id,
      buttonLabel: value.buttonLabel!,
      actionType: value.actionType!,
      actionLink: value.actionLink!,
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
  }, [canSave, value, simpleButton?.id, commit, router]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  // #endregion

  // #region Fields edition handlers

  const onButtonLabelChange = fieldUpdateHandler('buttonLabel');

  const onActionTypeChange = fieldUpdateHandler('actionType');

  const onActionLinkChange = fieldUpdateHandler('actionLink');

  const onFontFamilyChange = fieldUpdateHandler('fontFamily');

  const onFontColorChange = fieldUpdateHandler('fontColor');

  const onFontSizeChange = fieldUpdateHandler('fontSize');

  const onButtonColorChange = fieldUpdateHandler('buttonColor');

  const onBordercolorChange = fieldUpdateHandler('borderColor');

  const onBorderwidthChange = fieldUpdateHandler('borderWidth');

  const onBorderradiusChange = fieldUpdateHandler('borderRadius');

  const onMargintopChange = fieldUpdateHandler('marginTop');

  const onMarginbottomChange = fieldUpdateHandler('marginBottom');

  const onWidthChange = fieldUpdateHandler('width');

  const onHeightChange = fieldUpdateHandler('height');

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');

  // #endregion

  // #region tabs

  const [currentTab, setCurrentTab] = useState('settings');

  const {
    bottomPanelHeight,
    topPanelHeight,
    insetBottom,
    insetTop,
    windowWidth,
  } = useEditorLayout({ bottomPanelMinHeight: 450 });
  const intl = useIntl();

  return (
    <Container style={[styles.root, { paddingTop: insetTop }]}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Simple button',
          description: 'SimpleButton text screen title',
        })}
        leftElement={
          <HeaderButton
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Cancel button label in Simple Button module screen',
            })}
          />
        }
        rightElement={
          <HeaderButton
            disabled={!canSave}
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Save button label in Simple Button module screen',
            })}
          />
        }
        style={{ zIndex: 50 }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="position"
        keyboardVerticalOffset={-insetBottom - BOTTOM_MENU_HEIGHT}
      >
        <SimpleButtonPreview
          style={{ height: topPanelHeight - 20, marginVertical: 10 }}
          data={previewData}
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
                <SimpleButtonSettingsEditionPanel
                  viewer={viewer}
                  buttonLabel={buttonLabel ?? ''}
                  onButtonLabelChange={onButtonLabelChange}
                  actionType={actionType ?? ''}
                  onActionTypeChange={onActionTypeChange}
                  actionLink={actionLink ?? ''}
                  onActionLinkChange={onActionLinkChange}
                  fontFamily={fontFamily}
                  onFontFamilyChange={onFontFamilyChange}
                  fontColor={fontColor}
                  onFontColorChange={onFontColorChange}
                  fontSize={fontSize}
                  onFontSizeChange={onFontSizeChange}
                  buttonColor={buttonColor}
                  onButtonColorChange={onButtonColorChange}
                  style={{
                    flex: 1,
                    marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                  }}
                  bottomSheetHeight={bottomPanelHeight}
                />
              ),
            },
            {
              id: 'borders',
              element: (
                <SimpleButtonBordersEditionPanel
                  viewer={viewer}
                  borderColor={borderColor}
                  onBordercolorChange={onBordercolorChange}
                  borderWidth={borderWidth}
                  onBorderwidthChange={onBorderwidthChange}
                  borderRadius={borderRadius}
                  onBorderradiusChange={onBorderradiusChange}
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
                <SimpleButtonMarginsEditionPanel
                  marginTop={marginTop}
                  onMargintopChange={onMargintopChange}
                  marginBottom={marginBottom}
                  onMarginbottomChange={onMarginbottomChange}
                  width={width}
                  onWidthChange={onWidthChange}
                  height={height}
                  onHeightChange={onHeightChange}
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
                <SimpleButtonBackgroundEditionPanel
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
      </KeyboardAvoidingView>
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
            editedModuleId={simpleButton?.id}
            visible={currentTab === 'preview'}
            editedModuleInfo={{
              kind: MODULE_KIND_SIMPLE_BUTTON,
              data: previewData,
            }}
            height={topPanelHeight + bottomPanelHeight}
            contentPaddingBottom={insetBottom + BOTTOM_MENU_HEIGHT}
          />
        </Suspense>
      </View>
      <SimpleButtonEditionBottomMenu
        currentTab={currentTab}
        onItemPress={setCurrentTab}
        style={[
          styles.tabsBar,
          { bottom: insetBottom, width: windowWidth - 20 },
        ]}
      />
    </Container>
  );
};

export default SimpleButtonEditionScreen;

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
