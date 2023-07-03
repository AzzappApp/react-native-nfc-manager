import { Suspense, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  MODULE_KIND_SIMPLE_BUTTON,
  SIMPLE_BUTTON_DEFAULT_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import { GraphQLError } from '@azzapp/shared/createRelayEnvironment';
import { useRouter } from '#components/NativeRouter';
import WebCardPreview from '#components/WebCardPreview';
import useDataEditor from '#hooks/useDataEditor';
import useEditorLayout from '#hooks/useEditorLayout';
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
        }
      }
    `,
    viewerKey,
  );

  // #endregion

  // #region Data edition
  const { data, updates, updateFields, fieldUpdateHandler, dirty } =
    useDataEditor({
      initialValue: simpleButton,
      defaultValue: SIMPLE_BUTTON_DEFAULT_VALUES,
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
    background,
    backgroundStyle,
  } = data;
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<SimpleButtonEditionScreenUpdateModuleMutation>(graphql`
      mutation SimpleButtonEditionScreenUpdateModuleMutation(
        $input: SaveSimpleButtonModuleInput!
      ) {
        saveSimpleButtonModule(input: $input) {
          card {
            id
            modules {
              kind
              ...SimpleButtonEditionScreen_module
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
    //check the link format
    const { background, ...rest } = updates;

    const input: SaveSimpleButtonModuleInput = {
      moduleId: simpleButton?.id,
      backgroundId:
        simpleButton?.background?.id !== data.background?.id
          ? background?.id ?? null
          : simpleButton?.background?.id ?? null,
      ...rest,
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
  }, [
    canSave,
    updates,
    simpleButton?.id,
    simpleButton?.background?.id,
    data?.background?.id,
    commit,
    router,
  ]);

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

  const onBackgroundChange = useCallback(
    (backgroundId: string | null) => {
      updateFields({
        background:
          backgroundId == null
            ? null
            : viewer.moduleBackgrounds.find(
                ({ id }: { id: string }) => id === backgroundId,
              ),
      });
    },
    [updateFields, viewer.moduleBackgrounds],
  );

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
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="position"
        keyboardVerticalOffset={-insetBottom - BOTTOM_MENU_HEIGHT}
      >
        <SimpleButtonPreview
          style={{ height: topPanelHeight - 20, marginVertical: 10 }}
          data={data}
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
                  buttonLabel={buttonLabel}
                  onButtonLabelChange={onButtonLabelChange}
                  actionType={actionType}
                  onActionTypeChange={onActionTypeChange}
                  actionLink={actionLink}
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
                  backgroundId={background?.id}
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
          <WebCardPreview
            editedModuleId={simpleButton?.id}
            visible={currentTab === 'preview'}
            editedModuleInfo={{
              kind: MODULE_KIND_SIMPLE_BUTTON,
              data,
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
