import { Image } from 'expo-image';
import { Controller } from 'react-hook-form';
import { View } from 'react-native';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { AVATAR_WIDTH } from '#screens/MultiUserScreen/Avatar';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import type { ContactFormValues } from './ContactSchema';
import type { Control } from 'react-hook-form';

const ContactEditAvatar = ({
  control,
  onPickerRequested,
}: {
  control: Control<ContactFormValues>;
  onPickerRequested: () => void;
}) => {
  const styles = useStyleSheet(styleSheet);

  return (
    <View style={styles.avatarSection}>
      <Controller
        control={control}
        name="avatar"
        render={({ field: { value, onChange } }) =>
          value?.uri ? (
            <View style={styles.avatarContainer}>
              <PressableNative
                onPress={onPickerRequested}
                android_ripple={{
                  borderless: true,
                  foreground: true,
                }}
              >
                <View style={[styles.avatar, styles.avatarWrapper]}>
                  <Image source={{ uri: value?.uri }} style={styles.avatar} />
                </View>
              </PressableNative>
              <IconButton
                icon="delete_filled"
                variant="icon"
                iconStyle={styles.removeAvatarIcon}
                style={styles.removeAvatarButton}
                onPress={() => onChange(null)}
              />
            </View>
          ) : (
            <View style={styles.noAvatarContainer}>
              <PressableNative
                onPress={onPickerRequested}
                android_ripple={{
                  borderless: true,
                  foreground: true,
                }}
              >
                <View style={styles.noAvatar}>
                  <Icon icon="add" />
                </View>
              </PressableNative>
            </View>
          )
        }
      />
    </View>
  );
};
const ICON_WIDTH = 24;

const styleSheet = createStyleSheet(appearance => ({
  avatarSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  noAvatar: {
    width: AVATAR_WIDTH,
    height: AVATAR_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appearance === 'dark' ? colors.grey900 : colors.grey50,
    borderRadius: AVATAR_WIDTH / 2,
  },
  noAvatarContainer: {
    overflow: 'hidden',
    borderRadius: AVATAR_WIDTH / 2,
  },
  avatarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: AVATAR_WIDTH,
    height: AVATAR_WIDTH,
    borderRadius: AVATAR_WIDTH / 2,
    borderWidth: 4,
    borderColor: appearance === 'dark' ? colors.black : colors.white,
    overflow: 'visible',
  },
  avatarContainer: [
    {
      position: 'relative',
      borderRadius: AVATAR_WIDTH / 2,
      overflow: 'visible',
    },
    shadow({ appearance, direction: 'bottom' }),
  ],
  removeAvatarIcon: {
    tintColor: colors.red400,
  },
  removeAvatarButton: {
    position: 'absolute',
    top: AVATAR_WIDTH / 2 - ICON_WIDTH / 2,
    left: -ICON_WIDTH - 20,
  },
}));

export default ContactEditAvatar;
