import { Image } from 'react-native';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import type { ImageProps } from 'react-native';

const socialIcons = {
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
  get linkedin() {
    return require('./assets/social/linkedin.png');
  },
  get mastodon() {
    return require('./assets/social/mastodon.png');
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
  get pinterest() {
    return require('./assets/social/pinterest.png');
  },
  get snapchat() {
    return require('./assets/social/snapchat.png');
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
  get twitch() {
    return require('./assets/social/twitch.png');
  },
  get twitter() {
    return require('./assets/social/twitter.png');
  },
  get typefully() {
    return require('./assets/social/typefully.png');
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
} as const;

export type SocialIcons = keyof typeof socialIcons;

export type SocialIconProps = Omit<ImageProps, 'source'> & {
  icon: SocialIcons;
};

const SocialIcon = ({ icon, ...props }: SocialIconProps) => {
  const style = useStyleSheet(computedStyle);
  return (
    <Image
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
