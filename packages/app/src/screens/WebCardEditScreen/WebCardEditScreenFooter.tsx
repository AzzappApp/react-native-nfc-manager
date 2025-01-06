import { useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import ColorTriptychRenderer from '#components/ColorTriptychRenderer';
import { useWebCardColors } from '#components/WebCardColorPicker';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomMenu, { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { WebCardEditScreenFooter_webCard$key } from '#relayArtifacts/WebCardEditScreenFooter_webCard.graphql';
import type { BottomMenuItem } from '#ui/BottomMenu';
import type { DerivedValue } from 'react-native-reanimated';

export type WebCardEditScreenFooterProps = {
  webCard: WebCardEditScreenFooter_webCard$key;
  /**
   * Whether the webCard is in selection mode
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
   * A transition value for the selection mode
   */
  selectionModeTransition: DerivedValue<number>;
  /**
   * The transition value for the edit animation
   */
  editTransition: DerivedValue<number>;
  /**
   * A callback called when the user switch the edit mode display mode
   */
  onRequestPreview: () => void;
  /**
   * A callback called when the user press the add module button
   */
  onRequestNewModule: () => void;
  /**
   * A callback called when the user press the style button
   */
  onRequestWebCardStyle: () => void;
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
  /**
   * Called when the user press the duplicate button in edit selection mode
   */
  onDuplicate: () => void;
};

const WebCardEditScreenFooter = ({
  webCard: webCardKey,
  selectionMode,
  hasSelectedModules,
  selectionContainsHiddenModules,
  selectionModeTransition,
  editTransition,
  onRequestPreview,
  onRequestNewModule,
  onRequestColorPicker,
  onRequestWebCardStyle,
  onDelete,
  onToggleVisibility,
  onDuplicate,
}: WebCardEditScreenFooterProps) => {
  const webCard = useFragment(
    graphql`
      fragment WebCardEditScreenFooter_webCard on WebCard {
        cardModules {
          id
        }
        ...WebCardColorPicker_webCard
      }
    `,
    webCardKey,
  );

  const { colorPalette } = useWebCardColors(webCard);

  const insets = useScreenInsets();

  const onItemPress = useCallback(
    (key: string) => {
      switch (key) {
        case 'preview':
          onRequestPreview();
          break;
        case 'add':
          onRequestNewModule();
          break;
        case 'colorPicker':
          onRequestColorPicker();
          break;
        case 'style':
          onRequestWebCardStyle();
          break;
      }
    },
    [
      onRequestColorPicker,
      onRequestNewModule,
      onRequestPreview,
      onRequestWebCardStyle,
    ],
  );

  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);
  const tabs = useMemo<BottomMenuItem[]>(
    () => [
      {
        key: 'preview',
        icon: 'preview',
        label: intl.formatMessage({
          defaultMessage: 'Preview',
          description:
            'ProfileScreen bottom menu accessibility label for Preview tab',
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
        key: 'colorPicker',
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

  const bottomMenuStyle = useAnimatedStyle(() => ({
    opacity: 1 - selectionModeTransition.value,
    transform: [
      {
        translateY:
          (1 - editTransition.value) * (BOTTOM_MENU_HEIGHT + insets.bottom),
      },
    ],
  }));

  const selectionMenuStyle = useAnimatedStyle(() => ({
    opacity: selectionModeTransition.value,
  }));

  if (webCard.cardModules.length === 0) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: '5%',
            width: '90%',
            bottom: insets.bottom,
          },
          bottomMenuStyle,
        ]}
      >
        <BottomMenu tabs={tabs} showLabel onItemPress={onItemPress} />
      </Animated.View>

      <Animated.View
        style={[
          styles.selectionFooter,
          {
            paddingBottom: insets.bottom,
            height: BOTTOM_MENU_HEIGHT + insets.bottom,
          },
          selectionMenuStyle,
        ]}
        pointerEvents={selectionMode ? 'auto' : 'none'}
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
                description="Show button in webCard edition screen footer"
              />
            ) : (
              <FormattedMessage
                defaultMessage="Hide"
                description="Hide button in webCard edition screen footer"
              />
            )}
          </Text>
        </PressableNative>

        <PressableNative
          accessibilityRole="button"
          disabled={!hasSelectedModules}
          onPress={onDuplicate}
        >
          <Text
            variant="button"
            style={!hasSelectedModules && { color: colors.grey200 }}
          >
            <FormattedMessage
              defaultMessage="Duplicate"
              description="Duplicate button in webCard edition screen footer"
            />
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
              description="Delete button in webCard edition screen footer"
            />
          </Text>
        </PressableNative>
      </Animated.View>
    </>
  );
};

export default WebCardEditScreenFooter;

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
