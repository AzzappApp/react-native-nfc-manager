import { Image } from 'react-native';
import type { ImageProps } from 'react-native';

const icons = {
  get azzapp() {
    return require('./assets/azzapp.png');
  },
  get brightness() {
    return require('./assets/brightness.png');
  },
  get chevron() {
    return require('./assets/chevron.png');
  },
  get comment() {
    return require('./assets/comment.png');
  },
  get 'color-picker'() {
    return require('./assets/color-picker.png');
  },
  get contrast() {
    return require('./assets/contrast.png');
  },
  get desktop() {
    return require('./assets/desktop.png');
  },
  get edit() {
    return require('./assets/edit.png');
  },
  get effect() {
    return require('./assets/effect.png');
  },
  get flip() {
    return require('./assets/flip.png');
  },
  get heart() {
    return require('./assets/heart.png');
  },
  get picture() {
    return require('./assets/picture.png');
  },
  get plus() {
    return require('./assets/plus.png');
  },
  get rotate() {
    return require('./assets/rotate.png');
  },
  get saturation() {
    return require('./assets/saturation.png');
  },
  get temperature() {
    return require('./assets/temperature.png');
  },
  get timer() {
    return require('./assets/timer.png');
  },
  get title() {
    return require('./assets/title.png');
  },
  get vigneting() {
    return require('./assets/vigneting.png');
  },
} as const;

export type Icons = keyof typeof icons;

export type IconProps = Omit<ImageProps, 'source'> & { icon: Icons };

const Icon = ({ icon, ...props }: IconProps) => (
  <Image
    {...props}
    style={[{ resizeMode: 'contain' }, props.style]}
    source={icons[icon]}
  />
);

export default Icon;
