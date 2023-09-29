import behance from './assets/behance.svg';
import dev from './assets/dev.svg';
import discord from './assets/discord.svg';
import dribbble from './assets/dribbble.svg';
import facebook from './assets/facebook.svg';
import figma from './assets/figma.svg';
import github from './assets/github.svg';
import gitlab from './assets/gitlab.svg';
import glassdoor from './assets/glassdoor.svg';
import hashnode from './assets/hashnode.svg';
import instagram from './assets/instagram.svg';
import letterboxd from './assets/letterboxd.svg';
import linkedin from './assets/linkedin.svg';
import mastodon from './assets/mastodon.svg';
import messenger from './assets/messenger.svg';
import npm from './assets/npm.svg';
import patreon from './assets/patreon.svg';
import pinterest from './assets/pinterest.svg';
import snapchat from './assets/snapchat.svg';
import telegram from './assets/telegram.svg';
import tiktok from './assets/tiktok.svg';
import tripadvisor from './assets/tripadvisor.svg';
import twitch from './assets/twitch.svg';
import twitter from './assets/twitter.svg';
import typefully from './assets/typefully.svg';
import website from './assets/website.svg';
import whatsapp from './assets/whatsapp.svg';
import yelp from './assets/yelp.svg';
import youtube from './assets/youtube.svg';
import type { ImageProps } from 'next/image';

type SocialIconProps = Omit<ImageProps, 'alt' | 'src'> & {
  icon: SocialIcons;
};

const SocialIcon = ({ icon, ...props }: SocialIconProps) => {
  const SocialIcon = socialIcons[icon];
  if (!SocialIcon) return null;

  return <SocialIcon {...props} alt="icon" />;
};

export default SocialIcon;

const socialIcons = {
  behance,
  dev,
  discord,
  dribbble,
  facebook,
  figma,
  github,
  gitlab,
  glassdoor,
  hashnode,
  instagram,
  letterboxd,
  linkedin,
  mastodon,
  messenger,
  npm,
  patreon,
  pinterest,
  snapchat,
  telegram,
  tiktok,
  tripadvisor,
  twitch,
  twitter,
  typefully,
  whatsapp,
  yelp,
  youtube,
  website,
};

export type SocialIcons = keyof typeof socialIcons;
