import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import BottomMenu, { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ViewTransition from '#ui/ViewTransition';
import ProfileScreenButtonBar from './ProfileScreenButtonBar';
import { EDIT_TRANSITION_DURATION } from './profileScreenHelpers';
import type { FooterBarItem } from '#ui/FooterBar';
import type { ProfileScreenFooterProps } from './profileScreenTypes';

const ProfileScreenFooter = ({
  editing,
  ready,
  userName,
  currentEditionView,
  selectionMode,
  hasSelectedModules,
  selectionContainsHiddenModules,
  onHome,
  onEdit,
  onToggleFollow,
  onEditingDisplayModeChange,
  onRequestNewModule,
  onRequestColorPicker,
  onDelete,
  onToggleVisibility,
}: ProfileScreenFooterProps) => {
  const inset = useSafeAreaInsets();

  const onItemPress = useCallback(
    (key: string) => {
      switch (key) {
        case 'mobile':
        case 'desktop':
        case 'preview':
          onEditingDisplayModeChange(key);
          break;
        case 'add':
          onRequestNewModule();
          break;
        case 'colorpicker':
          onRequestColorPicker();
          break;
      }
    },
    [onEditingDisplayModeChange, onRequestColorPicker, onRequestNewModule],
  );

  const intl = useIntl();
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
          defaultMessage: 'Add a module',
          description:
            'ProfileScreen bottom menu accessibility label for Add a module button',
        }),
      },
      {
        key: 'colorpicker',
        icon: 'color_picker',
        label: intl.formatMessage({
          defaultMessage: 'Change background color',
          description:
            'ProfileScreen bottom menu accessibility label for Change background color button',
        }),
      },
      {
        key: 'preview',
        icon: 'preview',
        label: intl.formatMessage({
          defaultMessage: 'Preview',
          description:
            'ProfileScreen bottom menu accessibility label for Preview button',
        }),
      },
    ],
    [intl],
  );

  const styles = useStyleSheet(stylesheet);

  // TODO factorize this with editorLayout
  const bottomMargin = inset.bottom > 0 ? inset.bottom : 15;
  return (
    <>
      <ViewTransition
        transitions={['opacity']}
        transitionDuration={EDIT_TRANSITION_DURATION}
        style={[
          styles.buttonBar,
          {
            bottom: bottomMargin,
            opacity: editing ? 0 : 1,
          },
        ]}
        pointerEvents={editing ? 'none' : 'auto'}
        disableAnimation={!ready}
      >
        <ProfileScreenButtonBar
          userName={userName}
          onHome={onHome}
          onEdit={onEdit}
          onToggleFollow={onToggleFollow}
        />
      </ViewTransition>

      <ViewTransition
        transitions={['opacity']}
        transitionDuration={EDIT_TRANSITION_DURATION}
        style={[
          {
            position: 'absolute',
            left: '5%',
            width: '90%',
            bottom: bottomMargin,
            opacity: editing && !selectionMode ? 1 : 0,
          },
        ]}
        pointerEvents={editing ? 'auto' : 'none'}
        disableAnimation={!ready}
      >
        <BottomMenu
          tabs={tabs}
          currentTab={currentEditionView}
          onItemPress={onItemPress}
        />
      </ViewTransition>

      <ViewTransition
        transitions={['opacity']}
        transitionDuration={EDIT_TRANSITION_DURATION}
        style={[
          styles.selectionFooter,
          {
            paddingBottom: bottomMargin,
            height: BOTTOM_MENU_HEIGHT + bottomMargin,
            opacity: editing && selectionMode ? 1 : 0,
          },
        ]}
        pointerEvents={editing && selectionMode ? 'auto' : 'none'}
        disableAnimation={!ready}
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
      </ViewTransition>
    </>
  );
};

export default ProfileScreenFooter;

const stylesheet = createStyleSheet(appearance => ({
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
}));
