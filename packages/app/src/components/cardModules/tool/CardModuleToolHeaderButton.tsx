import { Platform, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { colors } from '#theme';
import { HEADER_HEIGHT } from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import Text from '#ui/Text';
import type { ButtonProps } from '#ui/Button';
import type { StyleProp, ViewStyle } from 'react-native';
import type { PressableProps } from 'react-native-gesture-handler';

//needs to be a pressable from gesture handler (hidden here to avoid other use)
const CardModuleToolHeaderButton =
  Platform.OS === 'android'
    ? ({
        activeOpacity = 0.2,
        style,
        children,
        label,
        ...rest
      }: ButtonProps &
        PressableProps & {
          activeOpacity?: number;
          style?: StyleProp<ViewStyle>;
        }) => {
        return (
          <Pressable
            style={({ pressed }) => {
              return [
                styles.doneButton,
                style,
                { opacity: pressed ? activeOpacity : 1 },
              ];
            }}
            {...rest}
          >
            <Text variant="button" style={styles.doneButtonText}>
              {label}
            </Text>
          </Pressable>
        );
      }
    : HeaderButton;

export default CardModuleToolHeaderButton;

const styles = StyleSheet.create({
  doneButton: {
    width: 74,
    height: HEADER_HEIGHT,
    paddingHorizontal: 0,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  doneButtonText: { color: colors.white },
});
