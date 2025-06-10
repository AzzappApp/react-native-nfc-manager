import omit from 'lodash/omit';
import {
  startTransition,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { graphql, useFragment, useMutation } from 'react-relay';
import * as z from 'zod';
import {
  getSocialLinksDefaultColors,
  SOCIAL_LINKS_DEFAULT_VALUES,
} from '@azzapp/shared/cardModuleHelpers';
import {
  isSocialLinkId,
  type SocialLinkItem,
} from '@azzapp/shared/socialLinkHelpers';
import AnimatedDataOverride from '#components/AnimatedDataOverride';
import { useOnFocus, useRouter } from '#components/NativeRouter';
import useBoolean from '#hooks/useBoolean';
import useEditorLayout from '#hooks/useEditorLayout';
import useHandleProfileActionError from '#hooks/useHandleProfileError';
import useModuleDataEditor from '#hooks/useModuleDataEditor';
import useScreenDimensions from '#hooks/useScreenDimensions';
import { BOTTOM_MENU_HEIGHT, BOTTOM_MENU_PADDING } from '#ui/BottomMenu';
import BottomSheetModal from '#ui/BottomSheetModal';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import ModuleEditionScreenTitle from '#ui/ModuleEditionScreenTitle';
import TabView from '#ui/TabView';
import { SocialLinksAddOrEditModal } from './SocialLinksAddOrEditModal';
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

  const [addLinkVisible, openAddLink, closeAddLink] = useBoolean(false);

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
          coverBackgroundColor
          cardColors {
            primary
            light
            dark
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
      links: [...(socialLinks?.links || [])],
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
      ...getSocialLinksDefaultColors(
        profile.webCard?.coverBackgroundColor,
        socialLinks,
      ),
    };
  }, [socialLinks, profile.webCard?.coverBackgroundColor]);

  const { data, value, fieldUpdateHandler, updateFields, dirty } =
    useModuleDataEditor({
      initialValue,
      cardStyle: null,
      styleValuesMap: null,
      defaultValues: SOCIAL_LINKS_DEFAULT_VALUES,
    });

  const {
    links: readOnlyLinks,
    iconColor,
    arrangement,
    backgroundId,
    backgroundStyle,
  } = data;

  const links = useMemo(
    () =>
      readOnlyLinks
        .sort((a, b) => a.position - b.position)
        .map((item, index) =>
          isSocialLinkId(item.socialId)
            ? {
                link: item.link,
                position: index,
                socialId: item.socialId,
              }
            : null,
        )
        .filter(item => item !== null),
    [readOnlyLinks],
  );

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
            cardModulesCount
            cardModules {
              id
              kind
              visible
              variant
              ...SocialLinksEditionScreen_module @alias(as: "socialLinks")
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

    const input: SaveSocialLinksModuleInput = {
      ...value,
      iconSize: iconSize.get(),
      borderWidth: borderWidth.get(),
      columnGap: columnGap.get(),
      marginTop: marginTop.get(),
      marginBottom: marginBottom.get(),
      marginHorizontal: marginHorizontal.get(),
      moduleId: socialLinks?.id,
      links: value.links!,
    };

    commit({
      variables: {
        webCardId: profile.webCard.id,
        input,
      },
      onCompleted() {
        if (module) {
          router.pop(1);
        } else {
          router.pop(2);
        }
      },
      onError(e) {
        console.log(e);
        handleProfileActionError(e);
      },
    });
  }, [
    canSave,
    profile.webCard,
    value,
    iconSize,
    borderWidth,
    columnGap,
    marginTop,
    marginBottom,
    marginHorizontal,
    socialLinks?.id,
    commit,
    router,
    module,
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

  const { height: screenHeight } = useScreenDimensions();

  const [pickedItem, setPickedItem] = useState<SocialLinkItem>();

  const onCloseAddLink = () => {
    setPickedItem(undefined);
    closeAddLink();
  };

  const onLinkItemPress = useCallback(
    (link: SocialLinkItem) => {
      setPickedItem(link);
      openAddLink();
    },
    [openAddLink],
  );

  useOnFocus(() => {
    // allow to open the link selection panel when we start from empty link list
    if (links.length === 0) {
      openAddLink();
    }
  });

  const animatedData = useDerivedValue(() => ({
    iconSize: iconSize.value,
    borderWidth: borderWidth.value,
    columnGap: columnGap.value,
    marginTop: marginTop.value,
    marginBottom: marginBottom.value,
    marginHorizontal: marginHorizontal.value,
  }));

  const tabs = useMemo(
    () => [
      {
        id: 'links',
        element: (
          <SocialLinksLinksEditionPanel
            initialLinks={links}
            onChangeLinks={onLinksChange}
            onAddLink={openAddLink}
            onItemPress={onLinkItemPress}
            style={{
              minHeight: bottomPanelHeight,
              flex: 1,
              marginBottom: BOTTOM_MENU_HEIGHT,
            }}
            showTitleWithLineHeader
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
            style={styles.tabStyle}
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
            style={styles.tabStyle}
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
            style={styles.tabStyle}
          />
        ),
      },
    ],
    [
      arrangement,
      backgroundId,
      backgroundStyle,
      borderWidth,
      bottomPanelHeight,
      columnGap,
      iconColor,
      iconSize,
      links,
      marginBottom,
      marginHorizontal,
      marginTop,
      onArrangementChange,
      onBackgroundChange,
      onBackgroundStyleChange,
      onIconColorChange,
      onLinkItemPress,
      onLinksChange,
      onTouched,
      openAddLink,
      profile,
    ],
  );

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
        style={styles.keyboardView}
        behavior="padding"
        keyboardVerticalOffset={-insetBottom - BOTTOM_MENU_HEIGHT}
      >
        <AnimatedDataOverride data={previewData} animatedData={animatedData}>
          {data => (
            <SocialLinksPreview
              style={styles.preview}
              colorPalette={profile.webCard?.cardColors}
              cardStyle={null}
              data={data}
            />
          )}
        </AnimatedDataOverride>
        <TabView
          style={{ height: bottomPanelHeight }}
          currentTab={currentTab}
          tabs={tabs}
        />
      </KeyboardAvoidingView>
      <View
        style={[styles.tabsBar, { bottom: insetBottom - BOTTOM_MENU_PADDING }]}
      >
        <SocialLinksEditionBottomMenu
          currentTab={currentTab}
          onItemPress={onMenuItemPressed}
          style={{ width: windowWidth - 20 }}
        />
      </View>
      <Suspense>
        <BottomSheetModal
          onDismiss={onCloseAddLink}
          visible={addLinkVisible}
          enableContentPanningGesture={false}
          height={screenHeight}
          showHandleIndicator={false}
        >
          <SocialLinksAddOrEditModal
            links={links}
            pickedItem={pickedItem}
            setPickedItem={setPickedItem}
            closeAddLink={closeAddLink}
            onLinksChange={onLinksChange}
          />
        </BottomSheetModal>
      </Suspense>
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
    left: 0,
    right: 0,
  },
  preview: {
    flex: 1,
    marginVertical: 10,
  },
  keyboardView: { flex: 1, justifyContent: 'flex-end' },
  tabStyle: {
    flex: 1,
    marginBottom: BOTTOM_MENU_HEIGHT,
  },
});
