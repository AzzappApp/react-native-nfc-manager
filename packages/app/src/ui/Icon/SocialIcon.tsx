import Animated from 'react-native-reanimated';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';
import type { ImageProps, ImageSourcePropType } from 'react-native';

const socialIcons: Record<SocialLinkId, ImageSourcePropType> = {
  get behance() {
    return require('./assets/social/behance.png');
  },
  get dev() {
    return require('./assets/social/dev.png');
  },
  get discord() {
    return require('./assets/social/discord.png');
  },
  get dribbble() {
    return require('./assets/social/dribbble.png');
  },
  get facebook() {
    return require('./assets/social/facebook.png');
  },
  get figma() {
    return require('./assets/social/figma.png');
  },
  get flickr() {
    return require('./assets/social/flickr.png');
  },
  get github() {
    return require('./assets/social/github.png');
  },
  get gitlab() {
    return require('./assets/social/gitlab.png');
  },
  get glassdoor() {
    return require('./assets/social/glassdoor.png');
  },
  get hashnode() {
    return require('./assets/social/hashnode.png');
  },
  get instagram() {
    return require('./assets/social/instagram.png');
  },
  get letterboxd() {
    return require('./assets/social/letterboxd.png');
  },
  get link() {
    return require('./assets/link.png');
  },
  get linkedin() {
    return require('./assets/social/linkedin.png');
  },
  get mail() {
    return require('./assets/social/mail.png');
  },
  get mastodon() {
    return require('./assets/social/mastodon.png');
  },
  get medium() {
    return require('./assets/social/medium.png');
  },
  get messenger() {
    return require('./assets/social/messenger.png');
  },
  get npm() {
    return require('./assets/social/npm.png');
  },
  get patreon() {
    return require('./assets/social/patreon.png');
  },
  get phone() {
    return require('./assets/social/phone.png');
  },
  get pinterest() {
    return require('./assets/social/pinterest.png');
  },
  get producthunt() {
    return require('./assets/social/producthunt.png');
  },
  get reddit() {
    return require('./assets/social/reddit.png');
  },
  get sms() {
    return require('./assets/social/sms.png');
  },
  get snapchat() {
    return require('./assets/social/snapchat.png');
  },
  get soundcloud() {
    return require('./assets/social/soundcloud.png');
  },
  get spotify() {
    return require('./assets/social/spotify.png');
  },
  get telegram() {
    return require('./assets/social/telegram.png');
  },
  get tiktok() {
    return require('./assets/social/tiktok.png');
  },
  get tripadvisor() {
    return require('./assets/social/tripadvisor.png');
  },
  get tumblr() {
    return require('./assets/social/tumblr.png');
  },
  get twitch() {
    return require('./assets/social/twitch.png');
  },
  get twitter() {
    return require('./assets/social/twitter-x.png');
  },
  get typefully() {
    return require('./assets/social/typefully.png');
  },
  get vimeo() {
    return require('./assets/social/vimeo.png');
  },
  get whatsapp() {
    return require('./assets/social/whatsapp.png');
  },
  get yelp() {
    return require('./assets/social/yelp.png');
  },
  get youtube() {
    return require('./assets/social/youtube.png');
  },
  get website() {
    return require('./assets/social/website.png');
  },
  get wechat() {
    return require('./assets/social/wechat.png');
  },
} as const;

export type SocialIconProps = Omit<ImageProps, 'source'> & {
  icon: SocialLinkId;
};

const SocialIcon = ({ icon, ...props }: SocialIconProps) => {
  const style = useStyleSheet(computedStyle);
  return (
    <Animated.Image
      {...props}
      style={[{ resizeMode: 'contain' }, style.tintColor, props.style]}
      source={socialIcons[icon]}
    />
  );
};

const computedStyle = createStyleSheet(appearance => ({
  tintColor: {
    tintColor: appearance === 'light' ? colors.black : colors.white,
  },
}));

export default SocialIcon;
