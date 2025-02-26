import { memo } from 'react';
import { type ImageProps } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';

const icons = {
  get missing() {
    return require('./assets/missing.png');
  },
  get about() {
    return require('./assets/about.png');
  },
  get add_media() {
    return require('./assets/add_media.png');
  },
  get account() {
    return require('./assets/account.png');
  },
  get action_alpha() {
    return require('./assets/action_alpha.png');
  },
  get action_filled() {
    return require('./assets/action_filled.png');
  },
  get action_stroke() {
    return require('./assets/action_stroke.png');
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
  get animate() {
    return require('./assets/animate.png');
  },
  get azzapp() {
    return require('./assets/azzapp.png');
  },
  get albums() {
    return require('./assets/albums.png');
  },
  get app_store() {
    return require('./assets/app_store.png');
  },
  get approve() {
    return require('./assets/approve.png');
  },
  get arrow_down() {
    return require('./assets/arrow_down.png');
  },
  get arrow_down_fill() {
    return require('./assets/arrow_down_fill.png');
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
  get big_grid() {
    return require('./assets/big_grid.png');
  },
  get bloc() {
    return require('./assets/bloc.png');
  },
  get bloc_text() {
    return require('./assets/bloc_text.png');
  },
  get bold() {
    return require('./assets/bold.png');
  },
  get border() {
    return require('./assets/border.png');
  },
  get brightness() {
    return require('./assets/brightness.png');
  },
  get calendar() {
    return require('./assets/calendar.png');
  },
  get camera() {
    return require('./assets/camera.png');
  },
  get carrousel_original_ratio() {
    return require('./assets/carroussel_original_ratio.png');
  },
  get carrousel_square() {
    return require('./assets/carroussel_square.png');
  },
  get carrousel_webcards() {
    return require('./assets/carroussel_webcards.png');
  },
  get chat() {
    return require('./assets/chat.png');
  },
  get check() {
    return require('./assets/check.png');
  },
  get check_round() {
    return require('./assets/check_round.png');
  },
  get check_filled() {
    return require('./assets/check_filled.png');
  },
  get chrono() {
    return require('./assets/chrono.png');
  },
  get clock() {
    return require('./assets/clock.png');
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
  get color_variant() {
    return require('./assets/color_variant.png');
  },
  get comment() {
    return require('./assets/comment.png');
  },
  get comment_filled() {
    return require('./assets/comment_filled.png');
  },
  get community() {
    return require('./assets/community.png');
  },
  get contact() {
    return require('./assets/contact.png');
  },
  get contact_us() {
    return require('./assets/contact_us.png');
  },
  get contrast() {
    return require('./assets/contrast.png');
  },
  get crop() {
    return require('./assets/crop.png');
  },
  get delete_filled() {
    return require('./assets/delete_filled.png');
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
  get down() {
    return require('./assets/down.png');
  },
  get duplicate() {
    return require('./assets/duplicate.png');
  },
  get earth() {
    return require('./assets/earth.png');
  },
  get edit() {
    return require('./assets/edit.png');
  },
  get empty() {
    return require('./assets/empty.png');
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
  get fixed_ratio() {
    return require('./assets/fixed_ratio.png');
  },
  get fixed_height() {
    return require('./assets/fixed_height.png');
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
  get flip() {
    return require('./assets/flip.png');
  },
  get font_color() {
    return require('./assets/font_color.png');
  },
  get font() {
    return require('./assets/font.png');
  },
  get font_size() {
    return require('./assets/font_size.png');
  },
  get font_color_letter() {
    return require('./assets/font_color_letter.png');
  },
  get font_color_dash() {
    return require('./assets/font_color_dash.png');
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
  get help() {
    return require('./assets/help.png');
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
  get image_top() {
    return require('./assets/image_top.png');
  },
  get image_bottom() {
    return require('./assets/image_bottom.png');
  },
  get image_video() {
    return require('./assets/image_video.png');
  },
  get information() {
    return require('./assets/information.png');
  },
  get inline() {
    return require('./assets/inline.png');
  },
  get invite() {
    return require('./assets/invite.png');
  },
  get invite_via() {
    return require('./assets/invite_via.png');
  },
  get italic() {
    return require('./assets/italic.png');
  },
  get keyboard() {
    return require('./assets/keyboard.png');
  },
  get landscape() {
    return require('./assets/landscape.png');
  },
  get layout() {
    return require('./assets/layout.png');
  },
  get like() {
    return require('./assets/like.png');
  },
  get like_filled() {
    return require('./assets/like_filled.png');
  },
  get link() {
    return require('./assets/link.png');
  },
  get location() {
    return require('./assets/location_line.png');
  },
  get locked() {
    return require('./assets/locked.png');
  },
  get lock_line() {
    return require('./assets/lock_line.png');
  },
  get logout() {
    return require('./assets/logout.png');
  },
  get mail() {
    return require('./assets/mail.png');
  },
  get mail_line() {
    return require('./assets/mail_line.png');
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
  get more() {
    return require('./assets/more.png');
  },
  get move_segment() {
    return require('./assets/move_segment.png');
  },
  get multi_media() {
    return require('./assets/multi_media.png');
  },
  get multi_user() {
    return require('./assets/multi-user.png');
  },
  get notification() {
    return require('./assets/notification.png');
  },
  get offline() {
    return require('./assets/offline.png');
  },
  get overlay() {
    return require('./assets/overlay.png');
  },
  get palette() {
    return require('./assets/palette.png');
  },
  get parameters() {
    return require('./assets/parameters.png');
  },
  get preview() {
    return require('./assets/preview.png');
  },
  get phone() {
    return require('./assets/phone.png');
  },
  get phone_full() {
    return require('./assets/phone_full.png');
  },
  get reduce() {
    return require('./assets/reduce.png');
  },
  get refresh() {
    return require('./assets/refresh.png');
  },
  get reload() {
    return require('./assets/reload.png');
  },
  get revert() {
    return require('./assets/revert.png');
  },
  get multiple() {
    return require('./assets/multiple.png');
  },
  get play() {
    return require('./assets/play.png');
  },
  get play_store() {
    return require('./assets/play_store.png');
  },
  get plus() {
    return require('./assets/plus.png');
  },
  get plus_white_border() {
    return require('./assets/plus_white_border.png');
  },
  get QR_code() {
    return require('./assets/QR_code.png');
  },
  get rotate() {
    return require('./assets/rotate.png');
  },
  get saturation() {
    return require('./assets/saturation.png');
  },
  get scan() {
    return require('./assets/scan.png');
  },
  get search() {
    return require('./assets/search.png');
  },
  get secret() {
    return require('./assets/secret.png');
  },
  get settings() {
    return require('./assets/settings.png');
  },
  get scroll() {
    return require('./assets/scroll.png');
  },
  get silhouette() {
    return require('./assets/silhouette.png');
  },
  get signature() {
    return require('./assets/signature.png');
  },
  get shadow() {
    return require('./assets/shadow.png');
  },
  get shadow_element() {
    return require('./assets/shadow_element.png');
  },
  get shadow_element_off() {
    return require('./assets/shadow_element_off.png');
  },
  get share() {
    return require('./assets/share.png');
  },
  get shared_webcard() {
    return require('./assets/shared_webcard.png');
  },
  get share_main() {
    return require('./assets/share_main.png');
  },
  get sharpness() {
    return require('./assets/sharpness.png');
  },
  get sharpness_mirror() {
    return require('./assets/sharpness_mirror.png');
  },
  get sms() {
    return require('./assets/sms.png');
  },
  get stop() {
    return require('./assets/stop.png');
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
  get tips() {
    return require('./assets/tips.png');
  },
  get transition() {
    return require('./assets/transition.png');
  },
  get trash() {
    return require('./assets/trash.png');
  },
  get trash_line() {
    return require('./assets/trash_line.png');
  },
  get txt_align_center() {
    return require('./assets/txt_align_center.png');
  },
  get txt_align_justify() {
    return require('./assets/txt_align_justify.png');
  },
  get txt_align_left() {
    return require('./assets/txt_align_left.png');
  },
  get txt_align_right() {
    return require('./assets/txt_align_right.png');
  },
  get unlock_line() {
    return require('./assets/unlock_line.png');
  },
  get underline() {
    return require('./assets/underline.png');
  },
  get vibrance() {
    return require('./assets/vibrance.png');
  },
  get video() {
    return require('./assets/video.png');
  },
  get video_film() {
    return require('./assets/video_film.png');
  },
  get vignetting() {
    return require('./assets/vignetting.png');
  },
  get warning() {
    return require('./assets/warning.png');
  },
  get wall() {
    return require('./assets/wall.png');
  },
  get whatsapp() {
    return require('./assets/whatsapp.png');
  },
  get width_full() {
    return require('./assets/width-full.png');
  },
  get width_limited() {
    return require('./assets/width-limited.png');
  },
  //this list is alphabetically sorted, please keep it that way
} as const;

export type Icons = keyof typeof icons;

export type IconProps = Omit<ImageProps, 'source'> & {
  icon: Icons;
  size?: number;
};

const Icon = ({ icon, size = 24, ...props }: IconProps) => {
  const styles = useStyleSheet(styleSheet);
  return (
    <Animated.Image
      {...props}
      style={[
        {
          resizeMode: 'contain',
          width: size,
          height: size,
        },
        shouldTintColor(icon) && styles.tintColor,
        props.style,
      ]}
      source={icons[icon]}
    />
  );
};

const styleSheet = createStyleSheet(appearance => ({
  tintColor: {
    tintColor: appearance === 'light' ? colors.black : colors.white,
  },
}));

export default memo(Icon);

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
    case 'plus':
      return false;
    case 'plus_white_border':
      return false;
    case 'menu':
      return false;
    default:
      return true;
  }
};
