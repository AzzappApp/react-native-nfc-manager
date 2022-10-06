import { Image } from 'react-native';
import type { ImageProps } from 'react-native';

const icons = {
  get account() {
    return require('./assets/account.png');
  },
  get add() {
    return require('./assets/add.png');
  },
  get adjust() {
    return require('./assets/adjust.png');
  },
  get 'arrow-down'() {
    return require('./assets/arrow-down.png');
  },
  get azzapp() {
    return require('./assets/azzapp.png');
  },
  get back() {
    return require('./assets/back.png');
  },
  get brightness() {
    return require('./assets/brightness.png');
  },
  get cancel() {
    return require('./assets/cancel.png');
  },
  get cross() {
    return require('./assets/cross.png');
  },
  get chat() {
    return require('./assets/chat.png');
  },
  get chevron() {
    return require('./assets/chevron.png');
  },
  get clock() {
    return require('./assets/clock.png');
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
  get flash() {
    return require('./assets/flash.png');
  },
  get 'flash-auto'() {
    return require('./assets/flash-auto.png');
  },
  get 'flash-disabled'() {
    return require('./assets/flash-disabled.png');
  },
  get flip() {
    return require('./assets/flip.png');
  },
  get foursquare() {
    return require('./assets/foursquare.png');
  },
  get hashtag() {
    return require('./assets/hashtag.png');
  },
  get grid() {
    return require('./assets/grid.png');
  },
  get heart() {
    return require('./assets/heart.png');
  },
  get home() {
    return require('./assets/home.png');
  },
  get lens() {
    return require('./assets/lens.png');
  },
  get location() {
    return require('./assets/location.png');
  },
  get invert() {
    return require('./assets/invert.png');
  },
  get magic() {
    return require('./assets/magic.png');
  },
  get parameters() {
    return require('./assets/parameters.png');
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
  get search() {
    return require('./assets/search.png');
  },
  get searchprofile() {
    return require('./assets/searchprofile.png');
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
  get video() {
    return require('./assets/video.png');
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
