'use client';

import React from 'react';
import { graphql } from 'react-relay';
import HomeScreen from '@azzapp/app/screens/HomeScreen';
import useServerQuery from '#hooks/useServerQuery';
import type { ServerQuery } from '#helpers/preloadServerQuery';
import type { HomeWebScreenQuery } from '@azzapp/relay/artifacts/HomeWebScreenQuery.graphql';

type HomePageProps = {
  serverQuery: ServerQuery<HomeWebScreenQuery>;
};

const HomeWebScreen = ({ serverQuery }: HomePageProps) => {
  const data = useServerQuery<HomeWebScreenQuery>(
    graphql`
      query HomeWebScreenQuery {
        viewer {
          ...HomeScreen_viewer
        }
      }
    `,
    serverQuery,
  );
  return <HomeScreen viewer={data.viewer} />;
};

export default HomeWebScreen;
