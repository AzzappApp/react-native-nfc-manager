import { omit } from 'lodash';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import * as z from 'zod';
import {
  MODULE_KIND_SOCIAL_LINKS,
  SOCIAL_LINKS_DEFAULT_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import { URL_REGEX } from '@azzapp/shared/stringHelpers';
import { useRouter } from '#components/NativeRouter';
import WebCardModulePreview from '#components/WebCardModulePreview';
import useEditorLayout from '#hooks/useEditorLayout';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
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

const socialLinkSchema = z
  .array(
    z.union([
      z.object({
        socialId: z.literal('website'),
        link: z.string().regex(URL_REGEX).nonempty(),
      }),
      z.object({
        socialId: z.custom<string>(value => value !== 'website'),
        link: z.string().nonempty(),
      }),
    ]),
  )
  .nonempty();

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
        marginHorizontal
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
      fragment SocialLinksEditionScreen_viewer on Viewer {
        ...SocialLinksSettingsEditionPanel_viewer
        ...SocialLinksBackgroundEditionPanel_viewer
        moduleBackgrounds {
          id
          uri
          resizeMode
        }
        profile {
          cardColors {
            primary
            light
            dark
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
      links: socialLinks?.links ?? [],
      iconColor: socialLinks?.iconColor ?? null,
      arrangement: socialLinks?.arrangement ?? null,
      borderWidth: socialLinks?.borderWidth ?? null,
      columnGap: socialLinks?.columnGap ?? null,
      marginTop: socialLinks?.marginTop ?? null,
      iconSize: socialLinks?.iconSize ?? null,
      marginBottom: socialLinks?.marginBottom ?? null,
      marginHorizontal: socialLinks?.marginHorizontal ?? null,
      backgroundId: socialLinks?.background?.id ?? null,
      backgroundStyle: socialLinks?.backgroundStyle ?? null,
    };
  }, [socialLinks]);

  const { data, value, fieldUpdateHandler, updateFields, dirty } =
    useModuleDataEditor({
      initialValue,
      cardStyle: null,
      styleValuesMap: null,
      defaultValues: SOCIAL_LINKS_DEFAULT_VALUES,
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
    marginHorizontal,
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
    useMutation<SocialLinksEditionScreenUpdateModuleMutation>(graphql`
      mutation SocialLinksEditionScreenUpdateModuleMutation(
        $input: SaveSocialLinksModuleInput!
      ) {
        saveSocialLinksModule(input: $input) {
          profile {
            id
            cardModules {
              kind
              visible
              ...SocialLinksEditionScreen_module
            }
          }
        }
      }
    `);

  const isValid = socialLinkSchema.safeParse(links).success;
  const canSave = dirty && isValid && !saving;

  const router = useRouter();
  const intl = useIntl();

  const onSave = useCallback(async () => {
    if (!canSave) {
      return;
    }

    const input: SaveSocialLinksModuleInput = {
      ...value,
      moduleId: socialLinks?.id,
      links: value.links!,
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
            description: 'SocialLinksEditionScreen - error toast',
          }),
        });
      },
    });
  }, [canSave, value, socialLinks?.id, commit, router, intl]);

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

  const onMarginHorizontalChange = fieldUpdateHandler('marginHorizontal');

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

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

  return (
    <Container style={[styles.root, { paddingTop: insetTop }]}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Social platforms',
          description: 'SocialLinks text screen title',
        })}
        leftElement={
          <HeaderButton
            variant="secondary"
            onPress={onCancel}
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Cancel button label in Social Link module screen',
            })}
          />
        }
        rightElement={
          <HeaderButton
            disabled={!canSave}
            onPress={onSave}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Save button label in Socia Link module screen',
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
          colorPalette={viewer.profile?.cardColors}
          cardStyle={null}
          data={previewData}
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
                  onMarginHorizontalChange={onMarginHorizontalChange}
                  marginHorizontal={marginHorizontal ?? 0}
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
            editedModuleId={socialLinks?.id}
            visible={currentTab === 'preview'}
            editedModuleInfo={{
              kind: MODULE_KIND_SOCIAL_LINKS,
              data: previewData,
            }}
            height={topPanelHeight + bottomPanelHeight}
            contentPaddingBottom={insetBottom + BOTTOM_MENU_HEIGHT}
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
