import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { colors } from '#theme';
import useScreenInsets from '#hooks/useScreenInsets';
import FloatingIconButton from '#ui/FloatingIconButton';
import Header, { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import { useEditTransition } from './ProfileScreenTransitions';

export type ProfileScreenHeaderProps = {
  /**
   * Whether the profile is in edit mode
   */
  editing: boolean;
  /**
   * Whether the profile is in selection mode
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
};

/**
 * The header of the profile screen.
 * in edit mode, it display a cancel and a save button
 * in view mode, it display a close button
 */
const ProfileScreenHeader = ({
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
}: ProfileScreenHeaderProps) => {
  const editTransition = useEditTransition();
  const inset = useScreenInsets();
  const intl = useIntl();

  const editHeaderStyle = useAnimatedStyle(() => ({
    height: (editTransition?.value ?? 0) * (HEADER_HEIGHT + 4),
    marginTop: (editTransition?.value ?? 0) * inset.top,
    opacity: editTransition?.value ?? 0,
  }));

  const closeStyle = useAnimatedStyle(() => ({
    opacity: 1 - (editTransition?.value ?? 0),
  }));

  return (
    <>
      <Animated.View style={editHeaderStyle}>
        <Header
          middleElement={
            selectionMode
              ? intl.formatMessage(
                  {
                    defaultMessage: '{nbSelectedModules} selected',
                    description:
                      'Webcard builder header title in module edition mode',
                  },
                  { nbSelectedModules },
                )
              : intl.formatMessage({
                  defaultMessage: 'Webcard builder',
                  description: 'Webcard builder header title',
                })
          }
          leftElement={
            selectionMode ? (
              <HeaderButton
                variant="secondary"
                onPress={onCancelEditModules}
                label={intl.formatMessage({
                  defaultMessage: 'Cancel',
                  description:
                    'Cancel edit modules button label in profile edition screen',
                })}
              />
            ) : (
              <HeaderButton
                variant="secondary"
                onPress={onEditModules}
                label={intl.formatMessage({
                  defaultMessage: 'Edit',
                  description:
                    'Edit modules button label in profile edition screen',
                })}
              />
            )
          }
          rightElement={
            selectionMode ? (
              selectionContainsAllModules ? (
                <HeaderButton
                  onPress={onUnSelectAllModules}
                  variant="secondary"
                  label={intl.formatMessage({
                    defaultMessage: 'Unselect',
                    description:
                      'Unselect all button label in profile edition screen',
                  })}
                />
              ) : (
                <HeaderButton
                  onPress={onSelectAllModules}
                  variant="secondary"
                  label={intl.formatMessage({
                    defaultMessage: 'Select all',
                    description:
                      'Select all button label in profile edition screen',
                  })}
                />
              )
            ) : (
              <HeaderButton
                onPress={onDone}
                label={intl.formatMessage({
                  defaultMessage: 'Done',
                  description: 'Done button label in profile edition screen',
                })}
              />
            )
          }
          style={{ backgroundColor: 'transparent', paddingBottom: 4 }}
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

export default ProfileScreenHeader;

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
