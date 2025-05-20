'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { updateWebCardViewsCounter } from '#app/actions/statisticsAction';
import DisplayWebCard from './WebCard';

import type { Media, PostWithCommentAndAuthor, WebCard } from '@azzapp/data';

import type { CardStyle } from '@azzapp/shared/cardHelpers';
import type { PropsWithChildren } from 'react';

type WebCardPageLayoutProps = PropsWithChildren<{
  webCard: WebCard;
  posts: PostWithCommentAndAuthor[];
  media: Media;
  cardBackgroundColor: string;
  lastModuleBackgroundColor: string;
  userName: string;
  color: string | null;
  isAzzappPlus: boolean;
  cardStyle: CardStyle;
}>;

const AppIntlProvider = dynamic(
  () => import('../../components/AppIntlProvider'),
  {
    ssr: false,
  },
);

const WebCardPageLayout = ({
  children,
  webCard,
  ...rest
}: WebCardPageLayoutProps) => {
  useEffect(() => {
    if (webCard?.id) {
      updateWebCardViewsCounter(webCard?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!webCard.userName) {
    return undefined;
  }

  return (
    <AppIntlProvider>
      <DisplayWebCard webCard={webCard} {...rest}>
        {children}
      </DisplayWebCard>
    </AppIntlProvider>
  );
};

export default WebCardPageLayout;
