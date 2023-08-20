import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '#theme';
import ColorTriptychRenderer from '#components/ColorTriptychRenderer';
import { useProfileCardColors } from '#components/ProfileColorPicker';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import BottomMenu, { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import {
  useEditTransition,
  useSelectionModeTransition,
} from './ProfileScreenTransitions';
import type { FooterBarItem } from '#ui/FooterBar';
import type { ProfileColorPicker_profile$key } from '@azzapp/relay/artifacts/ProfileColorPicker_profile.graphql';

export type ProfileScreenFooterProps = {
  profile: ProfileColorPicker_profile$key;
  /**
   * Whether the profile is in edit mode
   */
  editing: boolean;
  /**
   * Whether the profile is in selection mode
   */
  selectionMode: boolean;
  /**
   * True when the user select some modules
   */
  hasSelectedModules: boolean;
  /**
   * True when selection contains hidden modules
   */
  selectionContainsHiddenModules: boolean;
  /**
   * edit mode display mode
   */
  currentEditionView: 'desktop' | 'mobile';
  /**
   * A callback called when the user switch the edit mode display mode
   */
  onEditingDisplayModeChange: (view: 'desktop' | 'mobile') => void;
  /**
   * A callback called when the user press the add module button
   */
  onRequestNewModule: () => void;
  /**
   * A callback called when the user press the style button
   */
  onRequestWebcardStyle: () => void;
  /**
   * A callback called when the user press the color picker button
   */
  onRequestColorPicker: () => void;
  /**
   * Called when the user press the hide button in edit selection mode
   */
  onToggleVisibility: (visible: boolean) => void;
  /**
   * Called when the user press the delete button in edit selection mode
   */
  onDelete: () => void;
};

const ProfileScreenFooter = ({
  profile: profileKey,
  editing,
  currentEditionView,
  selectionMode,
  hasSelectedModules,
  selectionContainsHiddenModules,
  onEditingDisplayModeChange,
  onRequestNewModule,
  onRequestColorPicker,
  onRequestWebcardStyle,
  onDelete,
  onToggleVisibility,
}: ProfileScreenFooterProps) => {
  const { colorPalette } = useProfileCardColors(profileKey);

  const inset = useSafeAreaInsets();

  const onItemPress = useCallback(
    (key: string) => {
      switch (key) {
        case 'mobile':
        case 'desktop':
          onEditingDisplayModeChange(key);
          break;
        case 'add':
          onRequestNewModule();
          break;
        case 'colorpicker':
          onRequestColorPicker();
          break;
        case 'style':
          onRequestWebcardStyle();
          break;
      }
    },
    [
      onEditingDisplayModeChange,
      onRequestColorPicker,
      onRequestNewModule,
      onRequestWebcardStyle,
    ],
  );

  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);
  const tabs = useMemo<FooterBarItem[]>(
    () => [
      {
        key: 'mobile',
        icon: 'mobile',
        label: intl.formatMessage({
          defaultMessage: 'Mobile',
          description:
            'ProfileScreen bottom menu accessibility label for Mobile tab',
        }),
      },
      {
        key: 'desktop',
        icon: 'desktop',
        label: intl.formatMessage({
          defaultMessage: 'Desktop',
          description:
            'ProfileScreen bottom menu accessibility label for Desktop tab',
        }),
      },
      {
        key: 'add',
        icon: 'add',
        label: intl.formatMessage({
          defaultMessage: 'Add',
          description:
            'ProfileScreen bottom menu accessibility label for Add a module button',
        }),
      },
      {
        key: 'colorpicker',
        IconComponent: (
          <View style={styles.viewTriptych}>
            <ColorTriptychRenderer {...colorPalette} width={16} height={16} />
          </View>
        ),
        label: intl.formatMessage({
          defaultMessage: 'Colors',
          description:
            'ProfileScreen bottom menu accessibility label for Colors button',
        }),
      },
      {
        key: 'style',
        icon: 'text',
        label: intl.formatMessage({
          defaultMessage: 'Style',
          description:
            'ProfileScreen bottom menu accessibility label for webcard style button',
        }),
      },
    ],
    [colorPalette, intl, styles.viewTriptych],
  );

  const editTransition = useEditTransition();
  const selectionModeTransition = useSelectionModeTransition();

  // TODO factorize this with editorLayout
  const bottomMargin = inset.bottom > 0 ? inset.bottom : 15;

  const bottomMenuStyle = useAnimatedStyle(() => ({
    opacity: editTransition.value - selectionModeTransition.value,
  }));
  const selectionMenuStyle = useAnimatedStyle(() => ({
    opacity: editing ? selectionModeTransition.value : 0,
  }));
  return (
    <>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: '5%',
            width: '90%',
            bottom: bottomMargin,
          },
          bottomMenuStyle,
        ]}
        pointerEvents={editing ? 'auto' : 'none'}
      >
        <BottomMenu
          tabs={tabs}
          showLabel
          currentTab={currentEditionView}
          onItemPress={onItemPress}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.selectionFooter,
          {
            paddingBottom: bottomMargin,
            height: BOTTOM_MENU_HEIGHT + bottomMargin,
          },
          selectionMenuStyle,
        ]}
        pointerEvents={editing && selectionMode ? 'auto' : 'none'}
      >
        <PressableNative
          accessibilityRole="button"
          disabled={!hasSelectedModules}
          onPress={() => onToggleVisibility(selectionContainsHiddenModules)}
        >
          <Text
            variant="button"
            style={!hasSelectedModules && { color: colors.grey200 }}
          >
            {selectionContainsHiddenModules ? (
              <FormattedMessage
                defaultMessage="Show"
                description="Show button in profile edition screen footer"
              />
            ) : (
              <FormattedMessage
                defaultMessage="Hide"
                description="Hide button in profile edition screen footer"
              />
            )}
          </Text>
        </PressableNative>

        <PressableNative
          accessibilityRole="button"
          disabled={!hasSelectedModules}
          onPress={onDelete}
        >
          <Text
            variant="button"
            style={{
              color: hasSelectedModules ? colors.red400 : colors.grey200,
            }}
          >
            <FormattedMessage
              defaultMessage="Delete"
              description="Delete button in profile edition screen footer"
            />
          </Text>
        </PressableNative>
      </Animated.View>
    </>
  );
};

export default ProfileScreenFooter;

const styleSheet = createStyleSheet(appearance => ({
  buttonBar: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: 15,
    zIndex: 1,
  },
  bottomMenu: {
    marginHorizontal: 12,
  },
  selectionFooter: {
    position: 'absolute',
    width: '100%',
    left: 0,
    bottom: 0,
    backgroundColor: appearance === 'dark' ? colors.black : colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  colorPreview: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.grey200,
    marginLeft: 1,
  },
  viewTriptych: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.grey200,
  },
}));
