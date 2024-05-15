'use client';
import cn from 'classnames';
import { FormattedMessage, useIntl } from 'react-intl';
import { ArrowRightIcon } from '#assets';
import { useScroll } from '#hooks';
import { Button, ButtonIcon } from '#ui';
import { FormInput } from '#ui/Form';
//import FacebookIcon from '#ui/SocialIcons/assets/facebook.svg';
//import InstagramIcon from '#ui/SocialIcons/assets/instagram.svg';
import LinkedInIcon from '#ui/SocialIcons/assets/linkedin.svg';
//import MessengerIcon from '#ui/SocialIcons/assets/messenger.svg';
//import TiktokIcon from '#ui/SocialIcons/assets/tiktok.svg';
import MailIcon from '#ui/SocialIcons/assets/mail.svg';
import SmsIcon from '#ui/SocialIcons/assets/sms.svg';
import TwitterIcon from '#ui/SocialIcons/assets/twitter.svg';
import WhatsAppIcon from '#ui/SocialIcons/assets/whatsapp.svg';
import styles from './ShareModal.css';

type ShareModalContentProps = {
  link: string;
};

const ShareModalContent = (props: ShareModalContentProps) => {
  const { link } = props;
  const [scrollbar, position] = useScroll<HTMLDivElement>();
  const scrollbarWidth = scrollbar.current?.clientWidth;

  const showLeftButton =
    position && scrollbarWidth && position.x + scrollbarWidth >= position.width;
  const showRightButton = !position || (position && position.x <= 0);

  const intl = useIntl();

  const options = [
    {
      name: 'WhatsApp',
      icon: WhatsAppIcon,
      link: (text: string) => `https://wa.me/?text=${text}`,
    },
    {
      name: 'Twitter',
      icon: TwitterIcon,
      link: (text: string) => `https://twitter.com/intent/tweet?text=${text}`,
    },
    // @TODO find a way to share on Tiktok?
    // { name: 'TikTok', icon: TiktokIcon },
    // {
    //   name: 'Messenger',
    //   icon: MessengerIcon,
    // @TODO complete link when app is setup on facebook platform
    // link: (text: string) => `https://www.facebook.com/dialog/send?link=${text}&app_id=<APP_ID>`,
    //},
    // { name: 'Facebook',
    //   icon: FacebookIcon,
    // @TODO complete link when app is setup on facebook platform
    // link: (text: string) => `https://www.facebook.com/sharer/sharer.php?app_id=<APP_ID>&u=${text}`,
    // },
    // @TODO find a way to share on Instagram?
    // { name: 'Instagram', icon: InstagramIcon },
    {
      name: 'LinkedIn',
      icon: LinkedInIcon,
      link: (text: string) =>
        `https://www.linkedin.com/sharing/share-offsite/?url=${text}`,
    },
    {
      name: intl.formatMessage({
        defaultMessage: 'Email',
        id: 'ypL4py',
        description: 'Email share option',
      }),
      icon: MailIcon,
      link: (text: string) =>
        `mailto:?body=${intl.formatMessage(
          {
            defaultMessage: `Hello, I thought you could be interested in this post on Azzapp: {text}`,
            id: '8qc792',
            description: 'Email body for sharing',
          },
          { text },
        )}`,
    },
    {
      name: intl.formatMessage({
        defaultMessage: 'SMS',
        id: '1N27uT',
        description: 'SMS share option',
      }),
      icon: SmsIcon,
      link: (text: string) =>
        `sms:?body=${intl.formatMessage(
          {
            defaultMessage: `Hello, I thought you could be interested in this post on Azzapp: {text}`,
            id: 'IW1JD+',
            description: 'SMS body for sharing',
          },
          { text },
        )}`,
    },
  ];

  return (
    <div className={styles.content}>
      <ButtonIcon
        onClick={() => {
          scrollbar.current?.scrollTo({ left: 0, behavior: 'smooth' });
        }}
        width={30}
        height={30}
        color="white"
        Icon={ArrowRightIcon}
        className={cn(styles.navigation, styles.navigationLeft, {
          [styles.navigationHidden]: !showLeftButton,
        })}
      />
      <ButtonIcon
        width={30}
        height={30}
        color="white"
        Icon={ArrowRightIcon}
        className={cn(styles.navigation, styles.navigationRight, {
          [styles.navigationHidden]: !showRightButton,
        })}
        onClick={() => {
          scrollbar.current?.scrollTo({
            left: scrollbar.current?.clientWidth,
            behavior: 'smooth',
          });
        }}
      />
      <div className={styles.options} ref={scrollbar}>
        {options.map(option => (
          <div key={option.name} className={styles.option}>
            <ButtonIcon
              Icon={option.icon}
              height={50}
              width={50}
              className={styles.icon}
              onClick={() => window.open(option.link?.(link), '_ blank')}
            />
            <span className={styles.optionName}>{option.name}</span>
          </div>
        ))}
      </div>
      <div className={styles.copy}>
        <FormInput readOnly className={styles.link} value={link} />
        <Button
          onClick={() => {
            void navigator.clipboard.writeText(link);
          }}
          className={styles.copyButton}
        >
          <FormattedMessage
            defaultMessage="Copy"
            id="uYK5iy"
            description="Copy button"
          />
        </Button>
      </div>
    </div>
  );
};

export default ShareModalContent;
