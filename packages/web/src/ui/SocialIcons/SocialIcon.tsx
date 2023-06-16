import Image from 'next/image';
import behance from './assets/behance.png';
import dev from './assets/dev.png';
import discord from './assets/discord.png';
import dribbble from './assets/dribbble.png';
import facebook from './assets/facebook.png';
import figma from './assets/figma.png';
import github from './assets/github.png';
import gitlab from './assets/gitlab.png';
import glassdoor from './assets/glassdoor.png';
import google from './assets/google.png';
import hashnode from './assets/hashnode.png';
import instagram from './assets/instagram.png';
import kult from './assets/kult.png';
import letterboxd from './assets/letterboxd.png';
import linkedin from './assets/linkedin.png';
import mastodon from './assets/mastodon.png';
import messenger from './assets/messenger.png';
import npm from './assets/npm.png';
import patreon from './assets/patreon.png';
import pinterest from './assets/pinterest.png';
import snapchat from './assets/snapchat.png';
import telegram from './assets/telegram.png';
import tiktok from './assets/tiktok.png';
import tripadvisor from './assets/tripadvisor.png';
import twitch from './assets/twitch.png';
import twitter from './assets/twitter.png';
import typefully from './assets/typefully.png';
import whatsapp from './assets/whatsapp.png';
import yelp from './assets/yelp.png';
import youtube from './assets/youtube.png';
import type { ImageProps } from 'next/image';

type SocialIconProps = Omit<ImageProps, 'alt' | 'src'> & {
  icon: SocialIcons;
};

const SocialIcon = ({ icon, ...props }: SocialIconProps) => {
  if (!socialIcons[icon]) {
    return null;
  }
  // TODO better alt text
  return <Image {...props} src={socialIcons[icon]} alt={icon} />;
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
  google,
  hashnode,
  instagram,
  kult,
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
};

export type SocialIcons = keyof typeof socialIcons;
