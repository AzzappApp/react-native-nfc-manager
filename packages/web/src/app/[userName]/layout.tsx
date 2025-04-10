import { GoogleTagManager } from '@next/third-parties/google';
import cn from 'classnames';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import Script from 'next/script';
import { AxiomWebVitals } from 'next-axiom';
import { DEFAULT_LOCALE, isSupportedLocale } from '@azzapp/i18n';
import ClientWrapper from '#components/ClientWrapper';
import { getTranslationMessages } from '#helpers/i18nHelpers';
import { cachedGetWebCardByUserName } from './dataAccess';
import { themeClass } from './theme.css';
import type { ClientWrapperProps } from '#components/ClientWrapper';
import './styles.css';

const plusJakarta = Plus_Jakarta_Sans({
  display: 'swap',
  preload: false,
});

const RootLayout = async ({
  children,
  params: { userName } = {},
}: {
  children: ClientWrapperProps['children'];
  params?: { userName?: string };
}) => {
  const webCard = userName ? await cachedGetWebCardByUserName(userName) : null;

  let locale = webCard?.locale;
  if (locale == null) {
    locale =
      headers()
        .get('accept-language')
        ?.split(',')?.[0]
        .split('-')?.[0]
        .toLowerCase() ?? DEFAULT_LOCALE;
  }

  const currentLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  const messages = getTranslationMessages(currentLocale);
  return (
    <html
      lang={currentLocale}
      className={cn(plusJakarta.className, themeClass)}
    >
      <GoogleTagManager gtmId={`${process.env.NEXT_PUBLIC_GTM_ID}`} />
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta charSet="utf-8" />

        {/* todo better colors */}
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />

        <meta
          name="apple-app-site-association"
          content="/.well-known/apple-app-site-association"
        />

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
        <meta
          name="apple-itunes-app"
          content={`${process.env.NEXT_PUBLIC_APPLE_ITUNES_APP_META}`}
        />
      </head>
      <body>
        <ClientWrapper locale={locale} messages={messages}>
          {children}
        </ClientWrapper>
        <Script id="vh-fix" async>
          {`
            function applyVH() {
              document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
            }
            applyVH();
            window.addEventListener('resize', applyVH);

         `}
        </Script>
        <div id="portal" />
      </body>
      <AxiomWebVitals />
    </html>
  );
};

export default RootLayout;
