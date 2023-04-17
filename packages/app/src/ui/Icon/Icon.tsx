import { Image } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { ImageProps } from 'react-native';

const icons = {
  get missing() {
    return require('./assets/missing.png');
  },
  get account() {
    return require('./assets/account.png');
  },
  get add_circle() {
    return require('./assets/add_circle.png');
  },
  get add_filled() {
    return require('./assets/add_filled.png');
  },
  get add() {
    return require('./assets/add.png');
  },
  get albums() {
    return require('./assets/albums.png');
  },
  get arrow_down() {
    return require('./assets/arrow_down.png');
  },
  get arrow_left() {
    return require('./assets/arrow_left.png');
  },
  get arrow_right() {
    return require('./assets/arrow_right.png');
  },
  get arrow_up() {
    return require('./assets/arrow_up.png');
  },
  get background_text() {
    return require('./assets/background_text.png');
  },
  get background() {
    return require('./assets/background.png');
  },
  get border() {
    return require('./assets/border.png');
  },
  get brightness() {
    return require('./assets/brightness.png');
  },
  get camera() {
    return require('./assets/camera.png');
  },
  get carrousel_original_ratio() {
    return require('./assets/carroussel_original_ratio.png');
  },
  get carroussel_square() {
    return require('./assets/carroussel_square.png');
  },
  get chat() {
    return require('./assets/chat.png');
  },
  get chrono() {
    return require('./assets/chrono.png');
  },
  get close() {
    return require('./assets/close.png');
  },
  get closeFull() {
    return require('./assets/closeFull.png');
  },
  get color_palet() {
    return require('./assets/color_palet.png');
  },
  get color_picker() {
    return require('./assets/color_picker.png');
  },
  get comment() {
    return require('./assets/comment.png');
  },
  get contrast() {
    return require('./assets/contrast.png');
  },
  get crop() {
    return require('./assets/crop.png');
  },
  get delete() {
    return require('./assets/delete.png');
  },
  get desktop() {
    return require('./assets/desktop.png');
  },
  get display() {
    return require('./assets/display.png');
  },
  get expand() {
    return require('./assets/expand.png');
  },
  get file() {
    return require('./assets/file.png');
  },
  get filters() {
    return require('./assets/filters.png');
  },
  get flash_auto() {
    return require('./assets/flash_auto.png');
  },
  get flash_off() {
    return require('./assets/flash_off.png');
  },
  get flash_on() {
    return require('./assets/flash_on.png');
  },
  get font_color() {
    return require('./assets/font_color.png');
  },
  get font() {
    return require('./assets/font.png');
  },
  get foreground_text() {
    return require('./assets/foreground_text.png');
  },
  get foreground() {
    return require('./assets/foreground.png');
  },
  get grid() {
    return require('./assets/grid.png');
  },
  get height() {
    return require('./assets/height.png');
  },
  get highlight() {
    return require('./assets/highlight.png');
  },
  get hide() {
    return require('./assets/hide.png');
  },
  get home() {
    return require('./assets/home.png');
  },
  get image() {
    return require('./assets/image.png');
  },
  get image_left() {
    return require('./assets/image_left.png');
  },
  get image_right() {
    return require('./assets/image_right.png');
  },
  get keyboard() {
    return require('./assets/keyboard.png');
  },
  get like() {
    return require('./assets/like.png');
  },
  get link() {
    return require('./assets/link.png');
  },
  get mail() {
    return require('./assets/mail.png');
  },
  get margins() {
    return require('./assets/margins.png');
  },
  get menu() {
    return require('./assets/menu.png');
  },
  get mobile_filled() {
    return require('./assets/mobile_filled.png');
  },
  get mobile() {
    return require('./assets/mobile.png');
  },
  get multiple() {
    return require('./assets/multiple.png');
  },
  get notification() {
    return require('./assets/notification.png');
  },
  get preview() {
    return require('./assets/preview.png');
  },
  get reduce() {
    return require('./assets/reduce.png');
  },
  get revert() {
    return require('./assets/revert.png');
  },
  get saturation() {
    return require('./assets/saturation.png');
  },
  get search() {
    return require('./assets/search.png');
  },
  get settings() {
    return require('./assets/settings.png');
  },
  get shadow() {
    return require('./assets/shadow.png');
  },
  get sharpness() {
    return require('./assets/sharpness.png');
  },
  get structure() {
    return require('./assets/structure.png');
  },
  get temperature() {
    return require('./assets/temperature.png');
  },
  get templates() {
    return require('./assets/templates.png');
  },
  get text() {
    return require('./assets/text.png');
  },
  get tint() {
    return require('./assets/tint.png');
  },
  get txt_align_center() {
    return require('./assets/txt_align_center.png');
  },
  get txt_align_justif() {
    return require('./assets/txt_align_justif.png');
  },
  get txt_align_left() {
    return require('./assets/txt_align_left.png');
  },
  get txt_align_right() {
    return require('./assets/txt_align_right.png');
  },
  get vibrance() {
    return require('./assets/vibrance.png');
  },
  get video() {
    return require('./assets/video.png');
  },
  get vigneting() {
    return require('./assets/vigneting.png');
  },
  get width_full() {
    return require('./assets/width-full.png');
  },
  get width_limited() {
    return require('./assets/width-limited.png');
  },
} as const;

export type Icons = keyof typeof icons;

export type IconProps = Omit<ImageProps, 'source'> & {
  icon: Icons;
};

const Icon = ({ icon, ...props }: IconProps) => {
  const style = useStyleSheet(computedStyle);
  return (
    <Image
      {...props}
      style={[
        { resizeMode: 'contain' },
        shouldTintColor(icon) && style.tintColor,
        props.style,
      ]}
      source={icons[icon]}
    />
  );
};

const computedStyle = createStyleSheet(appearance => ({
  tintColor: {
    tintColor: appearance === 'light' ? colors.black : colors.white,
  },
}));

export default Icon;

const shouldTintColor = (icon: Icons) => {
  switch (icon) {
    case 'saturation':
      return false;
    case 'vibrance':
      return false;
    case 'account':
      return false;
    case 'missing':
      return false;
    default:
      return true;
  }
};
