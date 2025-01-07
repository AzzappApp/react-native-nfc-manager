import behance from './assets/behance.svg';
import dev from './assets/dev.svg';
import discord from './assets/discord.svg';
import dribbble from './assets/dribbble.svg';
import facebook from './assets/facebook.svg';
import figma from './assets/figma.svg';
import flickr from './assets/flickr.svg';
import github from './assets/github.svg';
import gitlab from './assets/gitlab.svg';
import glassdoor from './assets/glassdoor.svg';
import hashnode from './assets/hashnode.svg';
import instagram from './assets/instagram.svg';
import letterboxd from './assets/letterboxd.svg';
import link from './assets/link.svg';
import linkedin from './assets/linkedin.svg';
import mail from './assets/mail.svg';
import mastodon from './assets/mastodon.svg';
import medium from './assets/medium.svg';
import messenger from './assets/messenger.svg';
import npm from './assets/npm.svg';
import patreon from './assets/patreon.svg';
import phone from './assets/phone.svg';
import pinterest from './assets/pinterest.svg';
import producthunt from './assets/producthunt.svg';
import reddit from './assets/reddit.svg';
import sms from './assets/sms.svg';
import snapchat from './assets/snapchat.svg';
import soundcloud from './assets/soundcloud.svg';
import spotify from './assets/spotify.svg';
import telegram from './assets/telegram.svg';
import tiktok from './assets/tiktok.svg';
import tripadvisor from './assets/tripadvisor.svg';
import tumblr from './assets/tumblr.svg';
import twitch from './assets/twitch.svg';
import twitter from './assets/twitter.svg';
import typefully from './assets/typefully.svg';
import vimeo from './assets/vimeo.svg';
import website from './assets/website.svg';
import wechat from './assets/wechat.svg';
import whatsapp from './assets/whatsapp.svg';
import yelp from './assets/yelp.svg';
import youtube from './assets/youtube.svg';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';
import type { ImageProps } from 'next/image';
import type { SVGProps } from 'react';

type SocialIconProps = Omit<SVGProps<ImageProps>, 'alt' | 'src'> & {
  icon: SocialLinkId;
};

const socialIcons: Record<SocialLinkId, any> = {
  behance,
  dev,
  discord,
  dribbble,
  facebook,
  figma,
  flickr,
  github,
  gitlab,
  glassdoor,
  hashnode,
  instagram,
  letterboxd,
  link,
  linkedin,
  mastodon,
  medium,
  messenger,
  npm,
  patreon,
  pinterest,
  producthunt,
  reddit,
  snapchat,
  spotify,
  soundcloud,
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
  mail,
  phone,
  sms,
  vimeo,
  wechat,
  tumblr,
};

const SocialIcon = ({ icon, ...props }: SocialIconProps) => {
  const SocialIcon = socialIcons[icon];
  if (!SocialIcon) return null;

  return <SocialIcon {...props} alt="icon" />;
};

export default SocialIcon;
