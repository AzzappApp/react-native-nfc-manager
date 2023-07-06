import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@azzapp/i18n';
import { getTranslationMessages } from '#helpers/i18nHelpers';
import ClientWrapper from './ClientWrapper';
import './styles.css';

const plusJakarta = Plus_Jakarta_Sans({
  display: 'swap',
  preload: false,
});

const RootLayout = ({
  children,
  params: { lang } = {},
}: {
  children: React.ReactNode;
  params?: { lang?: string };
}) => {
  lang = lang ?? DEFAULT_LOCALE;

  const messages = getTranslationMessages(lang);

  return (
    <html lang={lang} className={plusJakarta.className}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <meta charSet="utf-8" />
        {/* todo better colors */}
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#ef3962" />
      </head>
      <body>
        <ClientWrapper locale={lang} messages={messages}>
          {children}
        </ClientWrapper>
        <Script id="vh-fix">
          {`
            function applyVH() {
              document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
            }
            applyVH();
            window.addEventListener('resize', applyVH);
         `}
        </Script>
      </body>
    </html>
  );
};

export default RootLayout;

export const generateStaticParams = () =>
  SUPPORTED_LOCALES.map(lang => ({ lang }));
