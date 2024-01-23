import { omit } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import * as z from 'zod';
import {
  SIMPLE_BUTTON_DEFAULT_VALUES,
  SIMPLE_BUTTON_STYLE_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import { isValidUrl, isPhoneNumber } from '@azzapp/shared/stringHelpers';
import { useRouter } from '#components/NativeRouter';
import useEditorLayout from '#hooks/useEditorLayout';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import TabView from '#ui/TabView';
import SimpleButtonBackgroundEditionPanel from './SimpleButtonBackgroundEditionPanel';
import SimpleButtonBordersEditionPanel from './SimpleButtonBordersEditionPanel';
import SimpleButtonEditionBottomMenu from './SimpleButtonEditionBottomMenu';
import SimpleButtonMarginsEditionPanel from './SimpleButtonMarginsEditionPanel';
import SimpleButtonPreview from './SimpleButtonPreview';
import SimpleButtonSettingsEditionPanel from './SimpleButtonSettingsEditionPanel';
import type { SimpleButtonEditionScreen_module$key } from '#relayArtifacts/SimpleButtonEditionScreen_module.graphql';
import type { SimpleButtonEditionScreen_profile$key } from '#relayArtifacts/SimpleButtonEditionScreen_profile.graphql';
import type {
  SimpleButtonEditionScreenUpdateModuleMutation,
  SaveSimpleButtonModuleInput,
} from '#relayArtifacts/SimpleButtonEditionScreenUpdateModuleMutation.graphql';
import type { CountryCode } from 'libphonenumber-js';
import type { ViewProps } from 'react-native';

export type SimpleButtonEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  profile: SimpleButtonEditionScreen_profile$key;
  /**
   * the current module to edit, if null, a new module will be created
   */
  module: SimpleButtonEditionScreen_module$key | null;
};

const actionTypeSchema = z.intersection(
  z.object({ buttonLabel: z.string().nonempty() }),
  z.union([
    z.object({
      actionType: z.literal('email'),
      actionLink: z.string().email().nonempty(),
    }),
    z
      .object({
        actionType: z.literal('link'),
        actionLink: z.string().nonempty(),
      })
      .refine(item => isValidUrl(item.actionLink)),
    z
      .object({
        actionType: z.custom<string>(
          value => value !== 'link' && value !== 'email',
        ),
        actionLink: z.string().nonempty(),
      })
      .refine(({ actionType, actionLink }) => {
        return isPhoneNumber(actionLink, actionType as CountryCode);
      }),
  ]),
);

/**
 * A component that allows to create or update the SimpleButton Webcard module.
 */
const SimpleButtonEditionScreen = ({
  module,
  profile: profileKey,
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

  const profile = useFragment(
    graphql`
      fragment SimpleButtonEditionScreen_profile on Profile {
        moduleBackgrounds {
          id
          uri
          resizeMode
        }
        webCard {
          id
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
          ...SimpleButtonBordersEditionPanel_webCard
          ...SimpleButtonSettingsEditionPanel_webCard
        }
        ...SimpleButtonBackgroundEditionPanel_profile
      }
    `,
    profileKey,
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
    cardStyle: profile?.webCard.cardStyle,
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
      profile.moduleBackgrounds.find(
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
          webCard {
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
  const isValid = actionTypeSchema.safeParse(value).success;
  const canSave = dirty && isValid && !saving;

  const router = useRouter();
  const intl = useIntl();

  const onSave = useCallback(async () => {
    if (!canSave || !profile.webCard) {
      return;
    }

    const input: SaveSimpleButtonModuleInput = {
      ...value,
      moduleId: simpleButton?.id,
      buttonLabel: value.buttonLabel!,
      actionType: value.actionType!,
      actionLink: value.actionLink!,
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
            defaultMessage: 'Error, could not save your module',
            description: 'Simple Button module screen - error toast',
          }),
        });
      },
    });
  }, [canSave, profile.webCard, value, simpleButton?.id, commit, router, intl]);

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
                <SimpleButtonSettingsEditionPanel
                  webCard={profile?.webCard ?? null}
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
                  webCard={profile?.webCard ?? null}
                  borderColor={borderColor}
                  onBorderColorChange={onBordercolorChange}
                  borderWidth={borderWidth}
                  onBorderWidthChange={onBorderwidthChange}
                  borderRadius={borderRadius}
                  onBorderRadiusChange={onBorderradiusChange}
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
      </KeyboardAvoidingView>
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
