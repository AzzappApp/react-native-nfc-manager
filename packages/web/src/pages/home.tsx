import MainTabBar from '@azzapp/app/lib/components/MainTabBar';
import HomeScreen from '@azzapp/app/lib/screens/HomeScreen';
import { TAB_BAR_HEIGHT } from '@azzapp/app/lib/ui/TabsBar';
import useClientLazyLoadQuery from '@azzapp/shared/lib/useClientLazyLoadQuery';
import Head from 'next/head';
import React from 'react';
import { graphql } from 'react-relay';
import ClientOnlySuspense from '../components/ClientSuspence';
import { getMessages } from '../helpers/i18nmessages';
import type { homePageQuery } from '@azzapp/relay/artifacts/homePageQuery.graphql';
import type { GetStaticProps } from 'next';

const HomePage = () => {
  const data = useClientLazyLoadQuery<homePageQuery>(
    graphql`
      query homePageQuery {
        viewer {
          ...HomeScreen_viewer
        }
      }
    `,
    {},
  );

  return (
    <div className="root" style={{ paddingBottom: TAB_BAR_HEIGHT }}>
      <Head>
        <title>Azzapp</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <ClientOnlySuspense fallback={null}>
        <style jsx>
          {`
            .mainNav {
              position: fixed;
              bottom: 0;
              left: 0;
              background-color: #fff;
              z-index: 1;
              width: 100vw;
            }
            .mainNav::before {
              content: '';
              position: absolute;

              background-color: transparent;
              top: -32vw;
              height: 32vw;
              width: 16vw;
              border-bottom-left-radius: 16vw;
              box-shadow: 0 16vw 0 0 #fff;
            }
            .mainNav::after {
              content: '';
              position: absolute;

              background-color: transparent;
              top: -32vw;
              right: 0;
              height: 32vw;
              width: 16vw;
              border-bottom-right-radius: 16vw;
              box-shadow: 0 16vw 0 0 #fff;
            }
          `}
        </style>
        <nav className="mainNav">
          <MainTabBar currentIndex={0} />
        </nav>
        <HomeScreen viewer={data.viewer} />
      </ClientOnlySuspense>
    </div>
  );
};

export const getStaticProps: GetStaticProps = context => {
  return {
    props: {
      i18nMessages: getMessages('home', context.locale),
    },
  };
};

export default HomePage;
