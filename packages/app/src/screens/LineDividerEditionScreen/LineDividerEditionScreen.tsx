import { startTransition, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment, useMutation } from 'react-relay';
import { LINE_DIVIDER_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import AnimatedDataOverride from '#components/AnimatedDataOverride';
import { useRouter } from '#components/NativeRouter';
import WebCardColorPicker from '#components/WebCardColorPicker';
import useEditorLayout from '#hooks/useEditorLayout';
import useHandleProfileActionError from '#hooks/useHandleProfileError';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import { BOTTOM_MENU_HEIGHT, BOTTOM_MENU_PADDING } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import ModuleEditionScreenTitle from '#ui/ModuleEditionScreenTitle';
import TabView from '#ui/TabView';

import LineDividerEditionBottomMenu from './LineDividerEditionBottomMenu';
import LineDividerMarginEditionPanel from './LineDividerMarginsEditionPanel';
import LineDividerPreview from './LineDividerPreview';
import LineDividerSettingsEditionPanel from './LineDividerSettingsEditionPanel';
import type { LineDividerEditionScreen_module$key } from '#relayArtifacts/LineDividerEditionScreen_module.graphql';
import type { LineDividerEditionScreen_webCard$key } from '#relayArtifacts/LineDividerEditionScreen_webCard.graphql';
import type { LineDividerEditionScreenUpdateModuleMutation } from '#relayArtifacts/LineDividerEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';

export type LineDividerEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  webCard: LineDividerEditionScreen_webCard$key | null;
  /**
   * the current module to edit, if null, a new module will be created
   */
  module: LineDividerEditionScreen_module$key | null;
};

/**
 * A component that allows to create or update the LineDivider Webcard module.
 */
const LineDividerEditionScreen = ({
  module,
  webCard: webCardKey,
}: LineDividerEditionScreenProps) => {
  // #region Data retrieval
  const lineDivider = useFragment(
    graphql`
      fragment LineDividerEditionScreen_module on CardModuleLineDivider {
        id
        orientation
        marginBottom
        marginTop
        height
        colorTop
        colorBottom
      }
    `,
    module,
  );

  const webCard = useFragment(
    graphql`
      fragment LineDividerEditionScreen_webCard on WebCard {
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
        ...WebCardColorPicker_webCard
        ...ModuleEditionScreenTitle_webCard
      }
    `,
    webCardKey,
  );
  // #endregion

  // #region Data edition
  const initialValue = useMemo(() => {
    return {
      orientation: lineDivider?.orientation ?? null,
      marginBottom: lineDivider?.marginBottom ?? null,
      marginTop: lineDivider?.marginTop ?? null,
      height: lineDivider?.height ?? null,
      colorTop: lineDivider?.colorTop ?? null,
      colorBottom: lineDivider?.colorBottom ?? null,
    };
  }, [lineDivider]);

  const { data, value, updateFields, fieldUpdateHandler, dirty } =
    useModuleDataEditor({
      initialValue,
      cardStyle: webCard?.cardStyle,
      styleValuesMap: null,
      defaultValues: LINE_DIVIDER_DEFAULT_VALUES,
    });

  const { orientation, colorTop, colorBottom } = data;
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<LineDividerEditionScreenUpdateModuleMutation>(graphql`
      mutation LineDividerEditionScreenUpdateModuleMutation(
        $webCardId: ID!
        $input: SaveLineDividerModuleInput!
      ) {
        saveLineDividerModule(webCardId: $webCardId, input: $input) {
          webCard {
            id
            requiresSubscription
            cardModules {
              id
              kind
              visible
              variant
              ...LineDividerEditionScreen_module @alias(as: "lineDivider")
            }
          }
        }
      }
    `);

  const [touched, setTouched] = useState(false);

  const onTouched = useCallback(() => {
    setTouched(true);
  }, []);

  const canSave = (dirty || lineDivider == null || touched) && !saving;

  const router = useRouter();
  const intl = useIntl();

  const onCancel = router.back;

  const handleProfileActionError = useHandleProfileActionError(
    intl.formatMessage({
      defaultMessage:
        'Could not save your line divider module, try again later',
      description:
        'Error toast message when saving a line divider module failed because of an unknown error.',
    }) as string,
  );
  // #endregion

  // #region Fields edition handlers
  const onOrientationChange = () => {
    updateFields({
      orientation: orientation === 'bottomRight' ? 'topLeft' : 'bottomRight',
    });
  };

  const height = useSharedValue(
    data.height ?? LINE_DIVIDER_DEFAULT_VALUES.height,
  );

  const onColorTopChange = fieldUpdateHandler('colorTop');

  const onColorBottomChange = fieldUpdateHandler('colorBottom');

  const marginTop = useSharedValue(
    data.marginTop ?? LINE_DIVIDER_DEFAULT_VALUES.marginTop,
  );

  const marginBottom = useSharedValue(
    data.marginBottom ?? LINE_DIVIDER_DEFAULT_VALUES.marginBottom,
  );

  const animatedData = useDerivedValue(() => {
    return {
      height: height.value,
      marginTop: marginTop.value,
      marginBottom: marginBottom.value,
    };
  });

  const onSave = useCallback(() => {
    if (!canSave || !webCard) {
      return;
    }

    commit({
      variables: {
        webCardId: webCard.id,
        input: {
          ...value,
          height: height.value,
          marginBottom: marginBottom.value,
          marginTop: marginTop.value,
          moduleId: lineDivider?.id,
        },
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
    webCard,
    commit,
    value,
    height,
    marginBottom,
    marginTop,
    lineDivider?.id,
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

  const [colorMode, setColorMode] = useState<'colorBottom' | 'colorTop'>(
    'colorTop',
  );
  const onCurrentTabChange = useCallback((currentTab: string) => {
    startTransition(() => {
      if (currentTab === 'colorBottom' || currentTab === 'colorTop') {
        setColorMode(currentTab);
        setShowContentModal(true);
      } else {
        setCurrentTab(currentTab);
      }
    });
  }, []);
  // #endregion

  const {
    bottomPanelHeight,
    topPanelHeight,
    insetBottom,
    insetTop,
    windowWidth,
  } = useEditorLayout();

  return (
    <Container style={[styles.root, { paddingTop: insetTop }]}>
      <Header
        middleElement={
          <ModuleEditionScreenTitle
            label={intl.formatMessage({
              defaultMessage: 'Divider #1',
              description: 'Line Divider text screen title',
            })}
            kind="lineDivider"
            webCardKey={webCard ?? null}
          />
        }
        leftElement={
          <HeaderButton
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Cancel button label in Line Divider module screen',
            })}
          />
        }
        rightElement={
          <HeaderButton
            disabled={!canSave}
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Save button label in  Line Divider module screen',
            })}
          />
        }
      />
      <AnimatedDataOverride data={data} animatedData={animatedData}>
        {data => (
          <LineDividerPreview
            style={{ height: topPanelHeight - 20, marginVertical: 10 }}
            data={data}
            colorPalette={webCard?.cardColors}
            cardStyle={webCard?.cardStyle}
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
              <LineDividerSettingsEditionPanel
                height={height}
                onTouched={onTouched}
                orientation={orientation}
                onOrientationChange={onOrientationChange}
              />
            ),
          },
          {
            id: 'margins',
            element: (
              <LineDividerMarginEditionPanel
                marginBottom={marginBottom}
                marginTop={marginTop}
                onTouched={onTouched}
                style={styles.tabStyle}
              />
            ),
          },
        ]}
      />
      <View
        style={[styles.tabsBar, { bottom: insetBottom - BOTTOM_MENU_PADDING }]}
      >
        <LineDividerEditionBottomMenu
          colorPalette={webCard?.cardColors}
          currentTab={currentTab}
          onItemPress={onCurrentTabChange}
          colorTop={colorTop}
          colorBottom={colorBottom}
          style={{ width: windowWidth - 20 }}
        />
      </View>
      {webCard && (
        <WebCardColorPicker
          visible={showContentModal}
          height={bottomPanelHeight}
          webCard={webCard}
          title={
            colorMode === 'colorTop'
              ? intl.formatMessage({
                  defaultMessage: 'Top Color',
                  description: 'Top Color title in Line Divider module screen',
                })
              : intl.formatMessage({
                  defaultMessage: 'Bottom Color',
                  description:
                    'Bottom Color title in Line Divider module screen',
                })
          }
          selectedColor={colorMode === 'colorTop' ? colorTop : colorBottom}
          onColorChange={
            colorMode === 'colorTop' ? onColorTopChange : onColorBottomChange
          }
          onRequestClose={onCloseContentModal}
        />
      )}
    </Container>
  );
};

export default LineDividerEditionScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabsBar: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  tabStyle: {
    flex: 1,
    marginBottom: BOTTOM_MENU_HEIGHT,
  },
});
