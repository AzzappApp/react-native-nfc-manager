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
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta charSet="utf-8" />

        <link rel="stylesheet" href="/smartbanner.min.css" />
        {/* todo better colors */}
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />

        {/* smart banner */}
        <meta name="smartbanner:title" content="Azzapp" />
        <meta
          name="smartbanner:author"
          content="The Ultimate Networking App
"
        />
        <meta name="smartbanner:price" content="DOWNLOAD for FREE" />
        <meta name="smartbanner:icon-google" content="/logo.svg" />
        <meta name="smartbanner:button" content="VIEW" />
        <meta
          name="smartbanner:button-url-google"
          content={process.env.NEXT_PUBLIC_DOWNLOAD_ANDROID_APP}
        />
        <meta name="smartbanner:enabled-platforms" content="android" />
        <meta name="smartbanner:close-label" content="Close" />
        <meta
          name="smartbanner:exclude-user-agent-regex"
          content="^.*(Version).*Safari"
        />
        <meta name="smartbanner:api" content="yes" />
        {/* smart banner */}

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
        <meta name="apple-itunes-app" content="app-id=6502694267" />
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
        <script src="/smartbanner.min.js" async />
        <Script id="smartbanner">
          {`
            if(smartbanner && smartbanner.publish) {
              smartbanner.publish();
            }
         `}
        </Script>
      </body>
      <AxiomWebVitals />
    </html>
  );
};

export default RootLayout;
