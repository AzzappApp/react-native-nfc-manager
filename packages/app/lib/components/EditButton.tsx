import { Image, Pressable, StyleSheet } from 'react-native';
import type { ViewProps } from 'react-native';

type EditButtonProps = ViewProps & {
  onPress: () => void;
};

const EditButton = ({ onPress, style, ...props }: EditButtonProps) => (
  <Pressable
    style={({ pressed }) => [
      styles.editButton,
      pressed && styles.editButtonPressed,
      style,
    ]}
    accessibilityRole="button"
    accessibilityLabel="Edit"
    onPress={onPress}
    {...props}
  >
    {({ pressed }) => (
      <Image
        source={require('./assets/edit-icon.png')}
        style={[styles.image, pressed && styles.imagePressed]}
      />
    )}
  </Pressable>
);

export default EditButton;

const styles = StyleSheet.create({
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonPressed: {
    borderColor: '#D0D0D0',
  },
  image: { width: 18, tintColor: 'white' },
  imagePressed: { width: 18, tintColor: '#D0D0D0' },
});
