import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import WebCardBuilderSubtitle from '#components/WebCardBuilderSubtitle';
import useScreenInsets from '#hooks/useScreenInsets';
import FloatingIconButton from '#ui/FloatingIconButton';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import Text from '#ui/Text';
import { useEditTransition } from './WebCardScreenTransitions';
import type { WebCardScreenHeader_webCard$key } from '#relayArtifacts/WebCardScreenHeader_webCard.graphql';

export type WebCardScreenHeaderProps = {
  /**
   * The webCard to display.
   */
  webCard: WebCardScreenHeader_webCard$key;
  /**
   * Whether the webCard is in edit mode
   */
  editing: boolean;
  /**
   * Whether the webCard is in selection mode
   */
  selectionMode: boolean;
  /**
   * The number of selected modules
   */
  nbSelectedModules: number;
  /**
   * The number of selected modules
   */
  selectionContainsAllModules: boolean;
  /**
   * Called when the user press the close button in view mode
   */
  onClose: () => void;
  /**
   * Called when the user press the cancel button in edit mode
   */
  onDone: () => void;
  /**
   * Called when the user press the edit modules button in view mode
   */
  onEditModules: () => void;
  /**
   * Called when the user press the close button in view mode
   */
  onCancelEditModules: () => void;
  /**
   * Called when the user press the select all button in selection mode
   */
  onSelectAllModules: () => void;
  /**
   * Called when the user press the unselect all button in selection mode
   */
  onUnSelectAllModules: () => void;
  /*
   * Disable all button
   */
  disabledButtons: boolean;
};

/**
 * The header of the webCard screen.
 * in edit mode, it display a cancel and a save button
 * in view mode, it display a close button
 */
const WebCardScreenHeader = ({
  webCard: webCardKey,
  editing,
  selectionMode,
  nbSelectedModules,
  selectionContainsAllModules,
  onClose,
  onDone,
  onEditModules,
  onCancelEditModules,
  onSelectAllModules,
  onUnSelectAllModules,
  disabledButtons,
}: WebCardScreenHeaderProps) => {
  const editTransition = useEditTransition();
  const inset = useScreenInsets();
  const intl = useIntl();

  const editHeaderStyle = useAnimatedStyle(() => ({
    height: (editTransition?.value ?? 0) * (HEADER_HEIGHT + 4),
    marginTop: (editTransition?.value ? 1 : 0) * inset.top,
    opacity: editTransition?.value ?? 0,
  }));

  const closeStyle = useAnimatedStyle(() => ({
    opacity: 1 - (editTransition?.value ?? 0),
  }));

  const webCard = useFragment(
    graphql`
      fragment WebCardScreenHeader_webCard on WebCard {
        id
        isPremium
        webCardKind
        cardModules {
          id
          kind
        }
      }
    `,
    webCardKey,
  );

  return (
    <>
      <Animated.View style={editHeaderStyle}>
        <Header
          middleElement={
            <View>
              <Text variant="large">
                {selectionMode ? (
                  <FormattedMessage
                    defaultMessage="{nbSelectedModules} selected"
                    description="Webcard builder header title in module edition mode"
                    values={{
                      nbSelectedModules,
                    }}
                  />
                ) : (
                  <FormattedMessage
                    defaultMessage="Webcard{azzappA} builder"
                    description="Webcard builder header title"
                    values={{
                      azzappA: <Text variant="azzapp">a</Text>,
                    }}
                  />
                )}
              </Text>
              {webCard && !webCard.isPremium && (
                <WebCardBuilderSubtitle
                  modules={webCard.cardModules}
                  webCard={webCard}
                />
              )}
            </View>
          }
          leftElement={
            (selectionMode && (
              <HeaderButton
                disabled={disabledButtons}
                variant="secondary"
                onPress={onCancelEditModules}
                label={intl.formatMessage({
                  defaultMessage: 'Cancel',
                  description:
                    'Cancel edit modules button label in webCard edition screen',
                })}
              />
            )) ||
            (webCard.cardModules?.length > 0 && (
              <HeaderButton
                disabled={disabledButtons}
                variant="secondary"
                onPress={onEditModules}
                label={intl.formatMessage({
                  defaultMessage: 'Select',
                  description:
                    'Select modules button label in webCard edition screen',
                })}
              />
            )) ||
            null
          }
          rightElement={
            selectionMode ? (
              selectionContainsAllModules ? (
                <HeaderButton
                  disabled={disabledButtons}
                  onPress={onUnSelectAllModules}
                  variant="secondary"
                  label={intl.formatMessage({
                    defaultMessage: 'Unselect',
                    description:
                      'Unselect all button label in webCard edition screen',
                  })}
                />
              ) : (
                <HeaderButton
                  disabled={disabledButtons}
                  onPress={onSelectAllModules}
                  variant="secondary"
                  label={intl.formatMessage({
                    defaultMessage: 'Select all',
                    description:
                      'Select all button label in webCard edition screen',
                  })}
                />
              )
            ) : (
              <HeaderButton
                disabled={disabledButtons}
                onPress={onDone}
                label={intl.formatMessage({
                  defaultMessage: 'Done',
                  description: 'Done button label in webCard edition screen',
                })}
              />
            )
          }
          style={{ backgroundColor: 'transparent', paddingBottom: 6 }}
        />
      </Animated.View>
      <Animated.View
        style={[styles.closeButton, { top: inset.top + 16 }, closeStyle]}
        pointerEvents={editing ? 'none' : 'auto'}
      >
        <FloatingIconButton
          icon="arrow_down"
          onPress={onClose}
          iconSize={30}
          variant="grey"
          iconStyle={{ tintColor: colors.white }}
        />
      </Animated.View>
    </>
  );
};

export default WebCardScreenHeader;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    start: 15,
    zIndex: 1,
  },
});
