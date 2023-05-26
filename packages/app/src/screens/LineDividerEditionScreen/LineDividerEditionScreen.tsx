import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { LINE_DIVIDER_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import { GraphQLError } from '@azzapp/shared/createRelayEnvironment';
import { useRouter } from '#PlatformEnvironment';
import ProfileColorPicker from '#components/ProfileColorPicker';
import useDataEditor from '#hooks/useDataEditor';
import useEditorLayout from '#hooks/useEditorLayout';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import TabView from '#ui/TabView';

import LineDividerEditionBottomMenu from './LineDividerEditionBottomMenu';
import LineDividerMarginEditionPanel from './LineDividerMarginsEditionPanel';
import LineDividerPreview from './LineDividerPreview';
import LineDividerSettingsEditionPanel from './LineDividerSettingsEditionPanel';
import type { LineDividerEditionScreen_module$key } from '@azzapp/relay/artifacts/LineDividerEditionScreen_module.graphql';
import type { LineDividerEditionScreen_viewer$key } from '@azzapp/relay/artifacts/LineDividerEditionScreen_viewer.graphql';
import type { LineDividerEditionScreenUpdateModuleMutation } from '@azzapp/relay/artifacts/LineDividerEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';

export type LineDividerEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  viewer: LineDividerEditionScreen_viewer$key;
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
  viewer: viewerKey,
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

  const viewer = useFragment(
    graphql`
      fragment LineDividerEditionScreen_viewer on Viewer {
        profile {
          ...ProfileColorPicker_profile
        }
      }
    `,
    viewerKey,
  );
  // #endregion

  // #region Data edition
  const { data, updates, updateFields, fieldUpdateHandler, dirty } =
    useDataEditor({
      initialValue: lineDivider,
      defaultValue: LINE_DIVIDER_DEFAULT_VALUES,
    });

  const {
    orientation,
    marginBottom,
    marginTop,
    height,
    colorTop,
    colorBottom,
  } = data;
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<LineDividerEditionScreenUpdateModuleMutation>(graphql`
      mutation LineDividerEditionScreenUpdateModuleMutation(
        $input: SaveLineDividerModuleInput!
      ) {
        saveLineDividerModule(input: $input) {
          card {
            id
            modules {
              kind
              ...LineDividerEditionScreen_module
            }
          }
        }
      }
    `);

  const canSave = dirty && !saving;

  const router = useRouter();
  const onSave = useCallback(() => {
    if (!canSave) {
      return;
    }

    commit({
      variables: {
        input: {
          moduleId: lineDivider?.id,
          ...updates,
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
  }, [canSave, updates, commit, lineDivider?.id, router]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  // #endregion

  // #region Fields edition handlers
  const onOrientationChange = () => {
    updateFields({
      orientation: orientation === 'bottomRight' ? 'topLeft' : 'bottomRight',
    });
  };

  const onHeightChange = fieldUpdateHandler('height');

  const onColorTopChange = fieldUpdateHandler('colorTop');

  const onColorBottomChange = fieldUpdateHandler('colorBottom');

  const onMarginBottomChange = fieldUpdateHandler('marginBottom');

  const onMarginTopChange = fieldUpdateHandler('marginTop');

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
  const onCurrentTabChange = useCallback(
    (currentTab: string) => {
      if (currentTab === 'colorBottom' || currentTab === 'colorTop') {
        setColorMode(currentTab);
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

  return (
    <Container style={[styles.root, { paddingTop: insetTop }]}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Divider #1',
          description: 'Line Divider text screen title',
        })}
        leftElement={
          <HeaderButton
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Cancel button label in Line Divier module screen',
            })}
          />
        }
        rightElement={
          <HeaderButton
            disabled={!canSave}
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Save button label in  Line Divier module screen',
            })}
          />
        }
      />
      <LineDividerPreview
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
              <LineDividerSettingsEditionPanel
                height={height}
                onHeightChange={onHeightChange}
                orientation={orientation}
                onOrientationChange={onOrientationChange}
              />
            ),
          },
          {
            id: 'margins',
            element: (
              <LineDividerMarginEditionPanel
                marginBottom={marginBottom ?? 0}
                marginTop={marginTop ?? 0}
                onMarginBottomChange={onMarginBottomChange}
                onMarginTopChange={onMarginTopChange}
                style={{
                  flex: 1,
                  marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                }}
              />
            ),
          },
        ]}
      />

      <LineDividerEditionBottomMenu
        currentTab={currentTab}
        onItemPress={onCurrentTabChange}
        colorTop={colorTop}
        colorBottom={colorBottom}
        style={[
          styles.tabsBar,
          { bottom: insetBottom, width: windowWidth - 20 },
        ]}
      />
      {viewer.profile && (
        <ProfileColorPicker
          visible={showContentModal}
          height={bottomPanelHeight}
          profile={viewer.profile}
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
    left: 10,
    right: 10,
  },
});
