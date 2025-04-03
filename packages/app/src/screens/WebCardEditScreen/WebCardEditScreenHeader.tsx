import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import WebCardBuilderSubtitle from '#components/WebCardBuilderSubtitle';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import Text from '#ui/Text';
import type { WebCardEditScreenHeader_webCard$key } from '#relayArtifacts/WebCardEditScreenHeader_webCard.graphql';
import type { DerivedValue } from 'react-native-reanimated';

export type WebCardEditScreenHeaderProps = {
  /**
   * The webCard to display.
   */
  webCard: WebCardEditScreenHeader_webCard$key;
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
  /*
   * Disable all button
   */
  disabledButtons: boolean;
  /**
   * The transition value for the edit animation
   */
  editTransition: DerivedValue<number>;
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
};

/**
 * The header of the webCard screen.
 * in edit mode, it display a cancel and a save button
 * in view mode, it display a close button
 */
const WebCardEditScreenHeader = ({
  webCard: webCardKey,
  selectionMode,
  nbSelectedModules,
  selectionContainsAllModules,
  disabledButtons,
  editTransition,
  onDone,
  onEditModules,
  onCancelEditModules,
  onSelectAllModules,
  onUnSelectAllModules,
}: WebCardEditScreenHeaderProps) => {
  const inset = useScreenInsets();
  const intl = useIntl();

  const webCard = useFragment(
    graphql`
      fragment WebCardEditScreenHeader_webCard on WebCard {
        id
        isPremium
        webCardKind
        isMultiUser
        cardModules {
          id
          kind
        }
      }
    `,
    webCardKey,
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY:
            -(HEADER_HEIGHT + 4 + inset.top) * (1 - editTransition.value),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          height: HEADER_HEIGHT + 4,
          width: '100%',
          zIndex: 1,
        },
        animatedStyle,
      ]}
    >
      <Container style={{ paddingTop: inset.top }}>
        <Header
          middleElement={
            <View>
              <Text variant="large">
                {selectionMode ? (
                  <FormattedMessage
                    defaultMessage="{nbSelectedModules, plural,
                      =0 {# selected}
                      =1 {# selected}
                      other {# selected}
                    }"
                    description="Webcard builder header title in module edition mode with selected modules"
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
                <WebCardBuilderSubtitle webCard={webCard} />
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
      </Container>
    </Animated.View>
  );
};

export default WebCardEditScreenHeader;
