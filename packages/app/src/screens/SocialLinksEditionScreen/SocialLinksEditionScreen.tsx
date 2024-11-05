import omit from 'lodash/omit';
import { startTransition, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment, useMutation } from 'react-relay';
import * as z from 'zod';
import {
  getSocialLinksDefaultValues,
  SOCIAL_LINKS_DEFAULT_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import { changeModuleRequireSubscription } from '@azzapp/shared/subscriptionHelpers';
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
import SocialLinksBackgroundEditionPanel from './SocialLinksBackgroundEditionPanel';
import SocialLinksEditionBottomMenu from './SocialLinksEditionBottomMenu';
import SocialLinksLinksEditionPanel from './SocialLinksLinksEditionPanel';
import SocialLinksMarginsEditionPanel from './SocialLinksMarginsEditionPanel';
import SocialLinksPreview from './SocialLinksPreview';
import SocialLinksSettingsEditionPanel from './SocialLinksSettingsEditionPanel';
import type { SocialLinksEditionScreen_module$key } from '#relayArtifacts/SocialLinksEditionScreen_module.graphql';
import type { SocialLinksEditionScreen_profile$key } from '#relayArtifacts/SocialLinksEditionScreen_profile.graphql';
import type {
  SocialLinksEditionScreenUpdateModuleMutation,
  SaveSocialLinksModuleInput,
} from '#relayArtifacts/SocialLinksEditionScreenUpdateModuleMutation.graphql';
import type { ViewProps } from 'react-native';

export type SocialLinksEditionScreenProps = ViewProps & {
  /**
   * the current viewer
   */
  profile: SocialLinksEditionScreen_profile$key;
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
        link: z.string().min(1),
      }),
      z.object({
        socialId: z.custom<string>(value => value !== 'website'),
        link: z.string().min(1),
      }),
    ]),
  )
  .nonempty();

/**
 * A component that allows to create or update the SocialLinks Webcard module.
 */
const SocialLinksEditionScreen = ({
  module,
  profile: profileKey,
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

  const profile = useFragment(
    graphql`
      fragment SocialLinksEditionScreen_profile on Profile {
        ...SocialLinksBackgroundEditionPanel_profile
        moduleBackgrounds {
          id
          uri
          resizeMode
        }
        webCard {
          id
          isPremium
          cardIsPublished
          coverBackgroundColor
          cardColors {
            primary
            light
            dark
          }
          cardModules {
            id
          }
          ...SocialLinksSettingsEditionPanel_webCard
          ...ModuleEditionScreenTitle_webCard
        }
      }
    `,
    profileKey,
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
      defaultValues: getSocialLinksDefaultValues(
        profile.webCard?.coverBackgroundColor,
      ),
    });

  const { links, iconColor, arrangement, backgroundId, backgroundStyle } = data;

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
    useMutation<SocialLinksEditionScreenUpdateModuleMutation>(graphql`
      mutation SocialLinksEditionScreenUpdateModuleMutation(
        $webCardId: ID!
        $input: SaveSocialLinksModuleInput!
      ) {
        saveSocialLinksModule(webCardId: $webCardId, input: $input) {
          webCard {
            id
            requiresSubscription
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

  const [touched, setTouched] = useState(false);

  const onTouched = useCallback(() => {
    setTouched(true);
  }, []);

  const canSave = (dirty || touched) && isValid && !saving;

  const router = useRouter();
  const intl = useIntl();

  const cardModulesCount =
    (profile.webCard?.cardModules.length ?? 0) + (socialLinks ? 0 : 1);

  const onCancel = router.back;

  const handleProfileActionError = useHandleProfileActionError(
    intl.formatMessage({
      defaultMessage: 'Error, could not save your module',
      description: 'SocialLinksEditionScreen - error toast',
    }) as string,
  );
  // #endregion

  // #region Fields edition handlers

  const onLinksChange = fieldUpdateHandler('links');

  const onIconColorChange = fieldUpdateHandler('iconColor');

  const onArrangementChange = useCallback(() => {
    updateFields({
      arrangement: arrangement === 'inline' ? 'multiline' : 'inline',
    });
  }, [arrangement, updateFields]);

  const iconSize = useSharedValue(
    data.iconSize ?? SOCIAL_LINKS_DEFAULT_VALUES.iconSize,
  );

  const borderWidth = useSharedValue(
    data.borderWidth ?? SOCIAL_LINKS_DEFAULT_VALUES.borderWidth,
  );

  const columnGap = useSharedValue(
    data.columnGap ?? SOCIAL_LINKS_DEFAULT_VALUES.columnGap,
  );

  const marginTop = useSharedValue(
    data.marginTop ?? SOCIAL_LINKS_DEFAULT_VALUES.marginTop,
  );

  const marginBottom = useSharedValue(
    data.marginBottom ?? SOCIAL_LINKS_DEFAULT_VALUES.marginBottom,
  );

  const marginHorizontal = useSharedValue(
    data.marginHorizontal ?? SOCIAL_LINKS_DEFAULT_VALUES.marginHorizontal,
  );

  const onBackgroundChange = fieldUpdateHandler('backgroundId');

  const onBackgroundStyleChange = fieldUpdateHandler('backgroundStyle');

  const onSave = useCallback(async () => {
    if (!canSave || !profile.webCard) {
      return;
    }

    const requireSubscription = changeModuleRequireSubscription(
      'socialLinks',
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

    const input: SaveSocialLinksModuleInput = {
      ...data,
      iconSize: iconSize.value,
      borderWidth: borderWidth.value,
      columnGap: columnGap.value,
      marginTop: marginTop.value,
      marginBottom: marginBottom.value,
      marginHorizontal: marginHorizontal.value,
      moduleId: socialLinks?.id,
      links: value.links!,
    };

    commit({
      variables: {
        webCardId: profile.webCard.id,
        input,
      },
      onCompleted() {
        router.back();
      },
      onError(e) {
        handleProfileActionError(e);
      },
    });
  }, [
    canSave,
    cardModulesCount,
    profile.webCard,
    value,
    data,
    iconSize,
    borderWidth,
    columnGap,
    marginTop,
    marginBottom,
    marginHorizontal,
    socialLinks?.id,
    commit,
    router,
    handleProfileActionError,
  ]);

  // #endregion

  // #region tabs

  const [currentTab, setCurrentTab] = useState('links');
  const onMenuItemPressed = useCallback(
    (tab: string) => {
      startTransition(() => {
        setCurrentTab(tab);
      });
    },
    [setCurrentTab],
  );

  // #endregion

  const { bottomPanelHeight, insetBottom, insetTop, windowWidth } =
    useEditorLayout({ bottomPanelMinHeight: 400 });

  return (
    <Container style={[styles.root, { paddingTop: insetTop }]}>
      <Header
        middleElement={
          <ModuleEditionScreenTitle
            label={intl.formatMessage({
              defaultMessage: 'Links',
              description: 'SocialLinks text screen title',
            })}
            kind="socialLinks"
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
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior="padding"
        keyboardVerticalOffset={-insetBottom - BOTTOM_MENU_HEIGHT}
      >
        <SocialLinksPreview
          style={{
            flex: 1,
            marginVertical: 10,
          }}
          colorPalette={profile.webCard?.cardColors}
          cardStyle={null}
          animatedData={{
            iconSize,
            borderWidth,
            columnGap,
            marginTop,
            marginBottom,
            marginHorizontal,
          }}
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
                />
              ),
            },
            {
              id: 'settings',
              element: (
                <SocialLinksSettingsEditionPanel
                  webCard={profile?.webCard ?? null}
                  iconColor={iconColor}
                  onIconColorChange={onIconColorChange}
                  arrangement={arrangement}
                  onArrangementChange={onArrangementChange}
                  iconSize={iconSize}
                  borderWidth={borderWidth}
                  columnGap={columnGap}
                  style={{
                    flex: 1,
                    marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                  }}
                  bottomSheetHeight={bottomPanelHeight}
                  onTouched={onTouched}
                />
              ),
            },
            {
              id: 'margins',
              element: (
                <SocialLinksMarginsEditionPanel
                  marginTop={marginTop}
                  marginBottom={marginBottom}
                  marginHorizontal={marginHorizontal ?? 0}
                  style={{
                    flex: 1,
                    marginBottom: insetBottom + BOTTOM_MENU_HEIGHT,
                  }}
                  bottomSheetHeight={bottomPanelHeight}
                  onTouched={onTouched}
                />
              ),
            },
            {
              id: 'background',
              element: (
                <SocialLinksBackgroundEditionPanel
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
      <SocialLinksEditionBottomMenu
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
