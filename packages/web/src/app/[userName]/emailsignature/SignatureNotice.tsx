'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import TabBar from '#ui/TabBar/TabBar';
import styles from './SignatureNotice.css';

const SignatureNotice = () => {
  const intl = useIntl();

  const tabs = useMemo(
    () => [
      {
        id: 'gmail',
        icon: (
          <Image src={require('./assets/gmail.png')} alt="Gmail" width={24} />
        ),
        title: intl.formatMessage({
          defaultMessage: 'Gmail',
          id: 'xNy6WL',
          description: 'Email Signature notice / Gmail tab',
        }),
      },
      {
        id: 'outlook',
        icon: (
          <Image
            src={require('./assets/outlook.png')}
            alt="Outlook"
            width={24}
          />
        ),
        title: intl.formatMessage({
          defaultMessage: 'Outlook',
          id: 'JDEE9t',
          description: 'Email Signature notice / Outlook tab',
        }),
      },
      {
        id: 'apple',
        icon: (
          <Image
            src={require('./assets/apple-mail.png')}
            alt="Apple"
            width={24}
          />
        ),
        title: intl.formatMessage({
          defaultMessage: 'Apple Mail',
          id: '7tUwzv',
          description: 'Email Signature notice / Apple tab',
        }),
      },
      {
        id: 'others',
        icon: (
          <Image src={require('./assets/other.png')} alt="Other" width={24} />
        ),
        title: intl.formatMessage({
          defaultMessage: 'Other',
          id: 'oX5UX+',
          description: 'Email Signature notice / Other',
        }),
      },
    ],
    [intl],
  );

  const clientNotices = useMemo<
    Record<string, Record<string, string[]> | string[]>
  >(
    () => ({
      gmail: {
        web: [
          intl.formatMessage({
            defaultMessage: 'Copy your signature',
            id: 'XVA3w0',
            description: 'Email Signature notice / Gmail / Step 1',
          }),
          intl.formatMessage({
            defaultMessage:
              'Click the settings gear and click "See all settings".',
            id: 'OIm/ZI',
            description: 'Email Signature notice / Gmail / Step 2',
          }),
          intl.formatMessage({
            defaultMessage:
              'In the "General" tab, scroll down until you see "Signature".',
            id: 'n0/2DH',
            description: 'Email Signature notice / Gmail / Step 3',
          }),
          intl.formatMessage({
            defaultMessage: 'Click the + button.',
            id: 'sdc7TG',
            description: 'Email Signature notice / Gmail / Step 4',
          }),
          intl.formatMessage({
            defaultMessage: 'Give your signature a name.',
            id: 'idSmRu',
            description: 'Email Signature notice / Gmail / Step 5',
          }),
          intl.formatMessage({
            defaultMessage: 'Paste your signature.',
            id: 'Vk4za4',
            description: 'Email Signature notice / Gmail / Step 6',
          }),
          intl.formatMessage({
            defaultMessage: 'Click "Save Changes".',
            id: 'mGoW62',
            description: 'Email Signature notice / Gmail / Step 7',
          }),
        ],
      },
      apple: {
        mobile: [
          intl.formatMessage({
            defaultMessage: 'Copy your signature',
            id: 'nmEgG9',
            description: 'Email Signature notice / Apple / mobile / Step 1',
          }),
          intl.formatMessage({
            defaultMessage: 'Open the "Settings" app.',
            id: 'zLnoa5',
            description: 'Email Signature notice / Apple / mobile / Step 2',
          }),
          intl.formatMessage({
            defaultMessage: 'Scroll down and choose "Mail".',
            id: '22tDJK',
            description: 'Email Signature notice / Apple / mobile / Step 3',
          }),
          intl.formatMessage({
            defaultMessage: 'Scroll down and tap "Signature".',
            id: 'nAyjg0',
            description: 'Email Signature notice / Apple / mobile / Step 4',
          }),
          intl.formatMessage({
            defaultMessage:
              'Paste the azzapp signature into the appropriate account.',
            id: 'jYLLQm',
            description: 'Email Signature notice / Apple / mobile / Step 5',
          }),
        ],
        mac: [
          intl.formatMessage({
            defaultMessage: 'Copy your signature',
            id: 'PyNSD8',
            description: 'Email Signature notice / Apple / mac / Step 1',
          }),
          intl.formatMessage({
            defaultMessage:
              'Click into the "Mail" menu and select "Preferences...".',
            id: 'eCf91a',
            description: 'Email Signature notice / Apple / mac / Step 2',
          }),
          intl.formatMessage({
            defaultMessage:
              'In the "Signatures" tab, uncheck the option for "Always match my default message font".',
            id: 'orDVjq',
            description: 'Email Signature notice / Apple / mac / Step 3',
          }),
          intl.formatMessage({
            defaultMessage: 'Click into the signature area.',
            id: 'liHsIm',
            description: 'Email Signature notice / Apple / mac / Step 4',
          }),
          intl.formatMessage({
            defaultMessage: 'Paste your signature.',
            id: 'T2gnKw',
            description: 'Email Signature notice / Apple / mac / Step 5',
          }),
        ],
      },
      outlook: {
        windows: [
          intl.formatMessage({
            defaultMessage: 'Copy your signature',
            id: '5nz2qz',
            description: 'Email Signature notice / Outlook / windows / Step 1',
          }),
          intl.formatMessage({
            defaultMessage:
              'In Outlook for Windows, click "New Email" to open a new email message.',
            id: 'Z5BWzE',
            description: 'Email Signature notice / Outlook / windows / Step 2',
          }),
          intl.formatMessage({
            defaultMessage:
              'On the Message menu, select Signature > Signatures.',
            id: '/qYCUw',
            description: 'Email Signature notice / Outlook / windows / Step 3',
          }),
          intl.formatMessage({
            defaultMessage:
              'Under Select signature to edit, choose New. In the New Signature dialog box, type in a name for the signature.',
            id: 'S/PIT1',
            description: 'Email Signature notice / Outlook / windows / Step 4',
          }),
          intl.formatMessage({
            defaultMessage: 'Under Edit signature, paste your signature.',
            id: 'KsWZG7',
            description: 'Email Signature notice / Outlook / windows / Step 5',
          }),
          intl.formatMessage({
            defaultMessage:
              'Under Choose default signature, select the email account you want to associate with your signature and if you want it to be added to all new messages by default.',
            id: 'I8EVqL',
            description: 'Email Signature notice / Outlook / windows / Step 6',
          }),
        ],
        mac: [
          intl.formatMessage({
            defaultMessage: 'Copy your signature',
            id: '1+2gGh',
            description: 'Email Signature notice / Outlook / mac / Step 1',
          }),
          intl.formatMessage({
            defaultMessage: 'In Outlook for Mac, click New Email.',
            id: 'nohcbp',
            description: 'Email Signature notice / Outlook / mac / Step 2',
          }),
          intl.formatMessage({
            defaultMessage: 'Click Signature > Signatures.',
            id: '8/1b+t',
            description: 'Email Signature notice / Outlook / mac / Step 3',
          }),
          intl.formatMessage({
            defaultMessage: 'Click + and name your signature.',
            id: '0VFyF8',
            description: 'Email Signature notice / Outlook / mac / Step 4',
          }),
          intl.formatMessage({
            defaultMessage: 'Under Signature, paste your signature.',
            id: '76Pjfc',
            description: 'Email Signature notice / Outlook / mac / Step 5',
          }),
          intl.formatMessage({
            defaultMessage: 'Under New Messages, select your signature.',
            id: '7y6nFV',
            description: 'Email Signature notice / Outlook / mac / Step 6',
          }),
        ],
        web: [
          intl.formatMessage({
            defaultMessage: 'Copy your signature',
            id: 'EXr88b',
            description: 'Email Signature notice / Outlook / web / Step 1',
          }),
          intl.formatMessage({
            defaultMessage: 'Sign in to Outlook.com.',
            id: 'cscGN2',
            description: 'Email Signature notice / Outlook / web / Step 2',
          }),
          intl.formatMessage({
            defaultMessage: 'Go to Settings.',
            id: '0K9cxC',
            description: 'Email Signature notice / Outlook / web / Step 3',
          }),
          intl.formatMessage({
            defaultMessage:
              'Select "Account" then "Signatures" then "+ New Signature".',
            id: 'ZCOpeB',
            description: 'Email Signature notice / Outlook / web / Step 5',
          }),
          intl.formatMessage({
            defaultMessage: 'Name your signature.',
            id: 'HoRu4B',
            description: 'Email Signature notice / Outlook / web / Step 5',
          }),
          intl.formatMessage({
            defaultMessage: 'Paste your email signature.',
            id: 'Mtsf2P',
            description: 'Email Signature notice / Outlook / web / Step 6',
          }),
          intl.formatMessage({
            defaultMessage:
              '(Optional) Select your new signature for new email messages, replies and forwards.',
            id: 'eynweQ',
            description: 'Email Signature notice / Outlook / web / Step 7',
          }),
          intl.formatMessage({
            defaultMessage: 'Save.',
            id: '8N0H2y',
            description: 'Email Signature notice / Outlook / web / Step 8',
          }),
        ],
      },
      others: [
        intl.formatMessage({
          defaultMessage: 'Copy your signature',
          id: 'xzVxua',
          description: 'Email Signature notice / Others / Step 1',
        }),
        intl.formatMessage({
          defaultMessage:
            'You can add an email signature directly within an email or in Settings for most email platforms.',
          id: 'v0TuLp',
          description: 'Email Signature notice / Others / Step 2',
        }),
      ],
    }),
    [intl],
  );

  const baseSubTabs = useMemo<
    Record<string, { icon: React.ReactNode; title: string }>
  >(
    () => ({
      web: {
        icon: <WebIcon width={24} />,
        title: intl.formatMessage({
          defaultMessage: 'Web',
          id: 'tB1Op6',
          description: 'Email Signature notice / Web',
        }),
      },
      mac: {
        icon: <MacIcon width={24} />,
        title: intl.formatMessage({
          defaultMessage: 'Mac',
          id: 'W4BKy3',
          description: 'Email Signature notice / Mac',
        }),
      },
      windows: {
        icon: <WindowsIcon width={24} />,
        title: intl.formatMessage({
          defaultMessage: 'Windows',
          id: 'rc+fk6',
          description: 'Email Signature notice / Windows',
        }),
      },
      mobile: {
        icon: <MobileIcon width={24} />,
        title: intl.formatMessage({
          defaultMessage: 'Mobile',
          id: 'qeSMME',
          description: 'Email Signature notice / Mobile',
        }),
      },
    }),
    [intl],
  );

  const [activeClient, setActiveClient] = useState('gmail');
  const [activeSubTab, setActiveSubTab] = useState('web');

  const onTabChange = (tab: string) => {
    setActiveClient(tab);
    const activeElementNotices = clientNotices[tab];
    if (Array.isArray(activeElementNotices)) {
      return;
    }
    const subTabsIds = Object.keys(activeElementNotices);
    setActiveSubTab(subTabsIds[0]);
  };

  const onSubTabChange = (tab: string) => {
    setActiveSubTab(tab);
  };

  const subTabs = useMemo(() => {
    const activeElementNotices = clientNotices[activeClient];
    if (Array.isArray(activeElementNotices)) {
      return null;
    }
    const subTabsIds = Object.keys(activeElementNotices);
    Object.keys(baseSubTabs).forEach(key => {
      if (!subTabsIds.includes(key)) {
        subTabsIds.push(key);
      }
    }, []);
    return subTabsIds.map(key => ({
      id: key,
      ...baseSubTabs[key],
      disabled: !activeElementNotices[key],
    }));
  }, [activeClient, baseSubTabs, clientNotices]);

  const steps = Array.isArray(clientNotices[activeClient])
    ? clientNotices[activeClient]
    : clientNotices[activeClient][activeSubTab];

  return (
    <>
      <TabBar
        activeTab={activeClient}
        onTabChange={onTabChange}
        className={styles.tabBar}
        tabs={tabs}
      />
      {subTabs && (
        <TabBar
          key={activeClient}
          activeTab={activeSubTab}
          onTabChange={onSubTabChange}
          className={styles.tabBar}
          tabs={subTabs}
          variant="toggle"
        />
      )}
      {steps.map((step, index) => (
        <div key={index} className={styles.step}>
          <label className={styles.stepIndex}>
            <FormattedMessage
              defaultMessage="STEP {index}"
              description="Email Signature notice / Step index"
              id="IO0D/Q"
              values={{ index }}
            />
          </label>
          <p>{step}</p>
        </div>
      ))}
    </>
  );
};
export default SignatureNotice;

const MacIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M11.9234 7.7221C11.0474 7.7221 9.69138 6.7261 8.26338 6.7621C6.37938 6.7861 4.65138 7.85409 3.67938 9.54609C1.72338 12.9421 3.17538 17.9581 5.08338 20.7181C6.01938 22.0621 7.12338 23.5741 8.58738 23.5261C9.99138 23.4661 10.5194 22.6141 12.2234 22.6141C13.9154 22.6141 14.3954 23.5261 15.8834 23.4901C17.3954 23.4661 18.3554 22.1221 19.2794 20.7661C20.3474 19.2061 20.7914 17.6941 20.8154 17.6101C20.7794 17.5981 17.8754 16.4821 17.8394 13.1221C17.8154 10.3141 20.1314 8.9701 20.2394 8.9101C18.9194 6.9781 16.8914 6.7621 16.1834 6.7141C14.3354 6.5701 12.7874 7.7221 11.9234 7.7221ZM15.0434 4.8901C15.8234 3.9541 16.3394 2.6461 16.1954 1.3501C15.0794 1.3981 13.7354 2.0941 12.9314 3.0301C12.2114 3.8581 11.5874 5.1901 11.7554 6.4621C12.9914 6.5581 14.2634 5.8261 15.0434 4.8901Z"
      fill="currentColor"
    />
  </svg>
);

const WebIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3.75 3.5H21.75C22.3023 3.5 22.75 3.94772 22.75 4.5V20.5C22.75 21.0523 22.3023 21.5 21.75 21.5H3.75C3.19772 21.5 2.75 21.0523 2.75 20.5V4.5C2.75 3.94772 3.19772 3.5 3.75 3.5ZM20.75 10.5H4.75V19.5H20.75V10.5ZM5.75 6.5V8.5H7.75V6.5H5.75ZM9.75 6.5V8.5H11.75V6.5H9.75Z"
      fill="currentColor"
    />
  </svg>
);

const MobileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3.75 3.5H21.75C22.3023 3.5 22.75 3.94772 22.75 4.5V20.5C22.75 21.0523 22.3023 21.5 21.75 21.5H3.75C3.19772 21.5 2.75 21.0523 2.75 20.5V4.5C2.75 3.94772 3.19772 3.5 3.75 3.5ZM20.75 10.5H4.75V19.5H20.75V10.5ZM5.75 6.5V8.5H7.75V6.5H5.75ZM9.75 6.5V8.5H11.75V6.5H9.75Z"
      fill="currentColor"
    />
  </svg>
);

const WindowsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3.75098 5.97902L11.1278 4.9625V12.0902H3.75098V5.97902ZM3.75098 19.021L11.1278 20.0375V12.9982H3.75098V19.021ZM11.9394 20.146L21.751 21.5V12.9982H11.9394V20.146ZM11.9394 4.85402V12.0902H21.751V3.5L11.9394 4.85402Z"
      fill="currentColor"
    />
  </svg>
);
