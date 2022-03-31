import { Image, Pressable, StyleSheet } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

type IconHeaderButtonProps = {
  icon: 'chevron' | 'edit';
  onPress: () => void;
  circled?: boolean;
  dark?: boolean;
};

const IconHeaderButton = ({
  icon,
  onPress,
  circled,
  dark,
}: IconHeaderButtonProps) => {
  let source: ImageSourcePropType;
  switch (icon) {
    case 'chevron':
      source = require('./assets/chevron-icon.png');
      break;
    case 'edit':
      source = require('./assets/edit-icon.png');
      break;
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        circled && styles.buttonCircled,
        circled && pressed && styles.buttonCircledPressed,
      ]}
      hitSlop={{ left: 20, right: 20 }}
    >
      {({ pressed }) => (
        <Image
          source={source}
          style={[
            styles.image,
            (circled || dark) && styles.darkImage,
            pressed && styles.imagePressed,
            circled && pressed && styles.circledImagePressed,
          ]}
        ></Image>
      )}
    </Pressable>
  );
};

export default IconHeaderButton;

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCircled: {
    backgroundColor: 'black',
  },
  buttonCircledPressed: {
    backgroundColor: '#AAA',
  },
  image: {
    tintColor: '#000',
  },
  darkImage: {
    tintColor: '#FFF',
  },
  imagePressed: {
    tintColor: '#AAA',
  },
  circledImagePressed: {
    tintColor: '#FFF',
  },
});
