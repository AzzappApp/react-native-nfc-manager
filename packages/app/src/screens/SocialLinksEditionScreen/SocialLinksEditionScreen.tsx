import { Suspense, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import {
  MODULE_KIND_SOCIAL_LINKS,
  SOCIAL_LINKS_DEFAULT_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import { GraphQLError } from '@azzapp/shared/createRelayEnvironment';
import { useRouter } from '#PlatformEnvironment';
import WebCardPreview from '#components/WebCardPreview';
import useDataEditor from '#hooks/useDataEditor';
import useEditorLayout from '#hooks/useEditorLayout';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import TabView from '#ui/TabView';
import SocialLinksBackgroundEditionPanel from './SocialLinksBackgroundEditionPanel';
import SocialLinksEditionBottomMenu from './SocialLinksEditionBottomMenu';
import SocialLinksLinksEditionPanel from './SocialLinksLinksEditionPanel';
import SocialLinksMarginsEditionPanel from './SocialLinksMarginsEditionPanel';
import SocialLinksPreview from './SocialLinksPreview';
import SocialLinksSettingsEditionPanel from './SocialLinksSettingsEditionPanel';
import type { SocialLinksEditionScreen_module$key } from '@azzapp/relay/artifacts/SocialLinksEditionScreen_module.graphql';
import type { SocialLinksEditionScreen_viewer$key } from '@azzapp/relay/artifacts/SocialLinksEditionScreen_viewer.graphql';
import type {
  SocialLinksEditionScreenUpdateModuleMutation,
  SaveSocialLinksModuleInput,
} from '@azzapp/relay/artifacts/SocialLinksEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';

export type SocialLinksEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  viewer: SocialLinksEditionScreen_viewer$key;
  /**
   * the current module to edit, if null, a new module will be created
   */
  module: SocialLinksEditionScreen_module$key | null;
};

/**
 * A component that allows to create or update the SocialLinks Webcard module.
 */
const SocialLinksEditionScreen = ({
  module,
  viewer: viewerKey,
}: SocialLinksEditionScreenProps) => {
  // #region Data retrieval
  const socialLinks = useFragment(
    graphql`
      fragment SocialLinksEditionScreen_module on CardModuleSocialLinks {
        id
        links {
          socialId
          link
          position
        }
        iconColor
        iconSize
        arrangement
        borderWidth
        columnGap
        marginTop
        marginBottom
        background {
          id
          uri
        }
        backgroundStyle {
          backgroundColor
          patternColor
          opacity
        }
      }
    `,
    module,
  );

  const viewer = useFragment(
    graphql`
      fragment SocialLinksEditionScreen_viewer on Viewer {
        ...SocialLinksSettingsEditionPanel_viewer
        ...SocialLinksBackgroundEditionPanel_viewer
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
      initialValue: socialLinks,
      defaultValue: SOCIAL_LINKS_DEFAULT_VALUES,
    });

  const {
    links,
    iconColor,
    arrangement,
    borderWidth,
    columnGap,
    marginTop,
    iconSize,
    marginBottom,
    background,
    backgroundStyle,
  } = data;
  // #endregion

  // #region Mutations and saving logic
  const [commit, saving] =
    useMutation<SocialLinksEditionScreenUpdateModuleMutation>(graphql`
      mutation SocialLinksEditionScreenUpdateModuleMutation(
        $input: SaveSocialLinksModuleInput!
      ) {
        saveSocialLinksModule(input: $input) {
          card {
            id
            modules {
              kind
              ...SocialLinksEditionScreen_module
            }
          }
        }
      }
    `);
  const isValid = links.length > 0;
  const canSave = dirty && isValid && !saving;

  const router = useRouter();

  const onSave = useCallback(async () => {
    if (!canSave) {
      return;
    }
    const {
      background: updateBackground,
      links: updateLinks,
      ...rest
    } = updates;

    const input: SaveSocialLinksModuleInput = {
      moduleId: socialLinks?.id,
      links: updateLinks != null ? updateLinks : socialLinks?.links ?? [],
      backgroundId:
        socialLinks?.background?.id !== data.background?.id
          ? updateBackground?.id ?? null
          : socialLinks?.background?.id ?? null,
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
    socialLinks?.id,
    socialLinks?.links,
    socialLinks?.background?.id,
    data?.background?.id,
    commit,
    router,
  ]);

  const onCancel = useCallback(() => {
    router.back();
  }, [router]);

  // #endregion

  // #region Fields edition handlers

  const onLinksChange = fieldUpdateHandler('links');

  const onIconColorChange = fieldUpdateHandler('iconColor');

  const onArrangementChange = useCallback(() => {
    updateFields({
      arrangement: arrangement === 'inline' ? 'multiline' : 'inline',
    });
  }, [arrangement, updateFields]);

  const onBorderWidthChange = fieldUpdateHandler('borderWidth');

  const onColumnGapChange = fieldUpdateHandler('columnGap');

  const onMarginTopChange = fieldUpdateHandler('marginTop');

  const onMarginBottomChange = fieldUpdateHandler('marginBottom');

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

  const [currentTab, setCurrentTab] = useState('links');

  // #endregion

  const {
    bottomPanelHeight,
    topPanelHeight,
    insetBottom,
    insetTop,
    windowWidth,
  } = useEditorLayout({ bottomPanelMinHeight: 400 });
  const intl = useIntl();

  return (
    <Container style={[styles.root, { paddingTop: insetTop }]}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'SocialLinks',
          description: 'SocialLinks text screen title',
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="position"
        keyboardVerticalOffset={-insetBottom - BOTTOM_MENU_HEIGHT}
      >
        <SocialLinksPreview
          style={{ height: topPanelHeight - 20, marginVertical: 10 }}
          data={data}
        />
        <TabView
          style={{ height: bottomPanelHeight }}
          currentTab={currentTab}
          tabs={[
            {
              id: 'links',
              element: (
                <SocialLinksLinksEditionPanel
                  links={links}
                  onLinksChange={onLinksChange}
                  style={{
                    minHeight: bottomPanelHeight,
                    flex: 1,
                    marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                  }}
                  bottomSheetHeight={bottomPanelHeight}
                />
              ),
            },
            {
              id: 'settings',
              element: (
                <SocialLinksSettingsEditionPanel
                  viewer={viewer}
                  iconColor={iconColor}
                  onIconColorChange={onIconColorChange}
                  arrangement={arrangement}
                  onArrangementChange={onArrangementChange}
                  iconSize={iconSize}
                  onIconSizeChange={fieldUpdateHandler('iconSize')}
                  borderWidth={borderWidth}
                  onBorderWidthChange={onBorderWidthChange}
                  columnGap={columnGap}
                  onColumnGapChange={onColumnGapChange}
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
                <SocialLinksMarginsEditionPanel
                  marginTop={marginTop}
                  onMarginTopChange={onMarginTopChange}
                  marginBottom={marginBottom}
                  onMarginBottomChange={onMarginBottomChange}
                  style={{
                    flex: 1,
                    marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                  }}
                  bottomSheetHeight={bottomPanelHeight}
                />
              ),
            },
            {
              id: 'background',
              element: (
                <SocialLinksBackgroundEditionPanel
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
            editedModuleId={socialLinks?.id}
            visible={currentTab === 'preview'}
            editedModuleInfo={{
              kind: MODULE_KIND_SOCIAL_LINKS,
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
      <SocialLinksEditionBottomMenu
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

export default SocialLinksEditionScreen;

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
