import capitalize from 'lodash/capitalize';
import { notFound, redirect } from 'next/navigation';
import { getMediasByIds, getRedirectWebCardByUserName } from '@azzapp/data';
import { DEFAULT_CARD_STYLE } from '@azzapp/shared/cardHelpers';
import { cachedGetWebCardByUserName } from '#app/[userName]/dataAccess';
import { getMetaData } from '#helpers/seo';
import CoverPageLayout from './CoverPageLayout';
import type { Metadata } from 'next';

type ProfilePageProps = {
  params: Promise<{
    userName: string;
  }>;
};

const ProfilePage = async (props: ProfilePageProps) => {
  const params = await props.params;
  const userName = params.userName;

  const webCard = await cachedGetWebCardByUserName(userName);
  if (!webCard) {
    const redirection = await getRedirectWebCardByUserName(userName);

    if (redirection.length > 0) {
      return redirect(`/${redirection[0].toUserName}`);
    }

    return notFound();
  }

  if (webCard.userName !== params.userName) {
    return redirect(`/${webCard.userName}`);
  }

  if (!webCard?.cardIsPublished) {
    return notFound();
  }

  const media = webCard.coverMediaId
    ? await getMediasByIds([webCard.coverMediaId]).then(([media]) => media)
    : null;

  if (!media) {
    return notFound();
  }

  return (
    <CoverPageLayout
      webCard={webCard}
      media={media}
      userName={params.userName}
      cardStyle={webCard.cardStyle ?? DEFAULT_CARD_STYLE}
    />
  );
};

export default ProfilePage;

export const dynamic = 'force-static';

export async function generateMetadata(
  props: ProfilePageProps,
): Promise<Metadata> {
  const params = await props.params;
  const webCard = await cachedGetWebCardByUserName(params.userName);
  const imageUrlOption = webCard?.updatedAt
    ? `?t=${webCard.updatedAt.getTime()}`
    : '';

  const meta = getMetaData({
    url: params.userName,
    title: capitalize(params.userName),
    ogImage: `/api/og/${params.userName}${imageUrlOption}`,
    description: `${params.userName} | Azzapp WebCard`,
    other: {
      twitter: {
        card: 'summary_large_image',
        images: `/api/og/${params.userName}${imageUrlOption}`,
      },
    },
  });
  return meta;
}

export const generateStaticParams = () => [];

export const dynamicParams = true;
