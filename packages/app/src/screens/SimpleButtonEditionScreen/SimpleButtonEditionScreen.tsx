import omit from 'lodash/omit';
import { startTransition, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment, useMutation } from 'react-relay';
import * as z from 'zod';
import {
  getButtonDefaultColors,
  SIMPLE_BUTTON_DEFAULT_VALUES,
  SIMPLE_BUTTON_STYLE_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import { isValidUrl, isPhoneNumber } from '@azzapp/shared/stringHelpers';
import { changeModuleRequireSubscription } from '@azzapp/shared/subscriptionHelpers';
import AnimatedDataOverride from '#components/AnimatedDataOverride';
import { useRouter } from '#components/NativeRouter';
import useEditorLayout from '#hooks/useEditorLayout';
import useHandleProfileActionError from '#hooks/useHandleProfileError';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import ModuleEditionScreenTitle from '#ui/ModuleEditionScreenTitle';
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
  z.object({ buttonLabel: z.string().min(1) }),
  z.union([
    z.object({
      actionType: z.literal('email'),
      actionLink: z.string().email().min(1),
    }),
    z
      .object({
        actionType: z.literal('link'),
        actionLink: z.string().min(1),
      })
      .refine(item => isValidUrl(item.actionLink)),
    z
      .object({
        actionType: z.custom<string>(
          value => value !== 'link' && value !== 'email',
        ),
        actionLink: z.string().min(1),
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
          coverBackgroundColor
          id
          cardIsPublished
          isPremium
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
          cardModules {
            id
          }
          ...SimpleButtonBordersEditionPanel_webCard
          ...SimpleButtonSettingsEditionPanel_webCard
          ...ModuleEditionScreenTitle_webCard
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
      actionType: simpleButton?.actionType ?? 'email',
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
      ...getButtonDefaultColors(
        profile.webCard?.coverBackgroundColor,
        simpleButton,
      ),
    };
  }, [simpleButton, profile.webCard?.coverBackgroundColor]);

  const { data, value, fieldUpdateHandler, dirty } = useModuleDataEditor({
    initialValue,
    cardStyle: profile?.webCard?.cardStyle,
    styleValuesMap: SIMPLE_BUTTON_STYLE_VALUES,
    defaultValues: SIMPLE_BUTTON_DEFAULT_VALUES,
  });

  const {
    buttonLabel,
    actionType,
    actionLink,
    fontFamily,
    fontColor,
    buttonColor,
    borderColor,
    backgroundId,
    backgroundStyle,
  } = data;

  const previewData = useMemo(
    () => ({
      ...omit(data, ['backgroundId']),
      background:
        profile.moduleBackgrounds.find(
          background => background.id === backgroundId,
        ) ?? null,
    }),
    [data, profile.moduleBackgrounds, backgroundId],
  );
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<SimpleButtonEditionScreenUpdateModuleMutation>(graphql`
      mutation SimpleButtonEditionScreenUpdateModuleMutation(
        $webCardId: ID!
        $input: SaveSimpleButtonModuleInput!
      ) {
        saveSimpleButtonModule(webCardId: $webCardId, input: $input) {
          webCard {
            id
            requiresSubscription
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

  const [touched, setTouched] = useState(false);

  const onTouched = useCallback(() => {
    setTouched(true);
  }, []);

  const canSave = (dirty || touched) && isValid && !saving;

  const router = useRouter();
  const intl = useIntl();

  const cardModulesCount =
    (profile.webCard?.cardModules.length ?? 0) + (simpleButton ? 0 : 1);

  const onCancel = router.back;

  const handleProfileActionError = useHandleProfileActionError(
    intl.formatMessage({
      defaultMessage: 'Error, could not save your module',
      description: 'Simple Button module screen - error toast',
    }) as string,
  );

  // #endregion

  // #region Fields edition handlers

  const onButtonLabelChange = fieldUpdateHandler('buttonLabel');

  const onActionTypeChange = fieldUpdateHandler('actionType');

  const onActionLinkChange = fieldUpdateHandler('actionLink');

  const onFontFamilyChange = fieldUpdateHandler('fontFamily');

  const onFontColorChange = fieldUpdateHandler('fontColor');

  const fontSize = useSharedValue(data.fontSize ?? null);

  const onButtonColorChange = fieldUpdateHandler('buttonColor');

  const onBordercolorChange = fieldUpdateHandler('borderColor');

  const borderWidth = useSharedValue(data.borderWidth ?? null);

  const borderRadius = useSharedValue(data.borderRadius ?? null);

  const marginTop = useSharedValue(data.marginTop ?? null);

  const marginBottom = useSharedValue(data.marginBottom ?? null);

  const width = useSharedValue(data.width ?? null);

  const height = useSharedValue(data.height ?? null);

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');

  const animatedData = useDerivedValue(() => ({
    fontSize: fontSize.value,
    borderWidth: borderWidth.value,
    borderRadius: borderRadius.value,
    marginTop: marginTop.value,
    marginBottom: marginBottom.value,
    width: width.value,
    height: height.value,
  }));

  const onSave = useCallback(async () => {
    if (!canSave || !profile.webCard) {
      return;
    }

    const requireSubscription = changeModuleRequireSubscription(
      'simpleButton',
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

    const input: SaveSimpleButtonModuleInput = {
      ...value,
      moduleId: simpleButton?.id,
      buttonLabel: value.buttonLabel!,
      actionType: value.actionType!,
      actionLink: value.actionLink!,
      fontSize: fontSize.value,
      borderWidth: borderWidth.value,
      borderRadius: borderRadius.value,
      marginTop: marginTop.value,
      marginBottom: marginBottom.value,
      width: width.value,
      height: height.value,
    };

    commit({
      variables: {
        webCardId: profile.webCard?.id,
        input,
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
    cardModulesCount,
    value,
    simpleButton?.id,
    fontSize,
    borderWidth,
    borderRadius,
    marginTop,
    marginBottom,
    width,
    height,
    commit,
    router,
    handleProfileActionError,
  ]);

  // #endregion

  // #region tabs

  const [currentTab, setCurrentTab] = useState('settings');
  const onMenuItemPressed = useCallback(
    (tab: string) => {
      startTransition(() => {
        setCurrentTab(tab);
      });
    },
    [setCurrentTab],
  );

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
        middleElement={
          <ModuleEditionScreenTitle
            label={intl.formatMessage({
              defaultMessage: 'Simple button',
              description: 'SimpleButton text screen title',
            })}
            kind="simpleButton"
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
        <AnimatedDataOverride data={previewData} animatedData={animatedData}>
          {data => (
            <SimpleButtonPreview
              style={{ height: topPanelHeight - 20, marginVertical: 10 }}
              data={data}
              colorPalette={profile?.webCard?.cardColors}
              cardStyle={profile?.webCard?.cardStyle}
            />
          )}
        </AnimatedDataOverride>
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
                  actionType={actionType ?? 'email'}
                  onActionTypeChange={onActionTypeChange}
                  actionLink={actionLink ?? ''}
                  onActionLinkChange={onActionLinkChange}
                  fontFamily={fontFamily}
                  onFontFamilyChange={onFontFamilyChange}
                  fontColor={fontColor}
                  onFontColorChange={onFontColorChange}
                  fontSize={fontSize}
                  buttonColor={buttonColor}
                  onButtonColorChange={onButtonColorChange}
                  style={styles.tabStyle}
                  bottomSheetHeight={bottomPanelHeight}
                  onTouched={onTouched}
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
                  borderRadius={borderRadius}
                  style={styles.tabStyle}
                  bottomSheetHeight={bottomPanelHeight}
                  onTouched={onTouched}
                />
              ),
            },
            {
              id: 'margins',
              element: (
                <SimpleButtonMarginsEditionPanel
                  marginTop={marginTop}
                  marginBottom={marginBottom}
                  width={width}
                  height={height}
                  style={styles.tabStyle}
                  onTouched={onTouched}
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
                  style={styles.tabStyle}
                />
              ),
            },
          ]}
        />
      </KeyboardAvoidingView>
      <SimpleButtonEditionBottomMenu
        currentTab={currentTab}
        onItemPress={onMenuItemPressed}
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
  tabStyle: {
    flex: 1,
    marginBottom: BOTTOM_MENU_HEIGHT,
  },
});
