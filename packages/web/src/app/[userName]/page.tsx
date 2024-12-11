import capitalize from 'lodash/capitalize';
import { notFound } from 'next/navigation';
import {
  getCardModulesByWebCard,
  getMediasByIds,
  getProfilesPostsWithTopComment,
  getModuleBackgroundsByIds,
} from '@azzapp/data';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  DEFAULT_CARD_STYLE,
  DEFAULT_COLOR_PALETTE,
  swapColor,
} from '@azzapp/shared/cardHelpers';
import {
  MODULES_DEFAULT_VALUES,
  MODULES_STYLES_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import CoverRenderer from '#components/renderer/CoverRenderer';
import CoverRendererBackground from '#components/renderer/CoverRenderer/CoverRendererBackground';
import ModuleRenderer from '#components/renderer/ModuleRenderer';
import { getMetaData } from '#helpers/seo';
import { cachedGetWebCardByUserName } from './dataAccess';
import styles from './WebCardPage.css';
import WebCardPageLayout from './WebCardPageLayout';
import type { Metadata } from 'next';

type ProfilePageProps = {
  params: {
    userName: string;
  };
};

const ProfilePage = async ({ params }: ProfilePageProps) => {
  const userName = params.userName.toLowerCase();
  const webCard = await cachedGetWebCardByUserName(userName);

  if (!webCard?.cardIsPublished) {
    return notFound();
  }

  const [posts, modules, media] = await Promise.all([
    getProfilesPostsWithTopComment(webCard.id, 5, 0),
    getCardModulesByWebCard(webCard.id),
    webCard.coverMediaId
      ? getMediasByIds([webCard.coverMediaId]).then(([media]) => media)
      : null,
  ]);

  const backgroundIds = convertToNonNullArray([
    ...modules.map(module => (module.data as any).backgroundId),
    ...modules.map(module => (module.data as any).textBackgroundId),
  ]);

  const backgrounds = backgroundIds.length
    ? await getModuleBackgroundsByIds(backgroundIds)
    : [];

  if (!media) {
    return notFound();
  }

  const resizeModes = new Map(
    convertToNonNullArray(backgrounds).map(b => [b.id, b.resizeMode!]),
  );

  const cardColors = webCard.cardColors ?? DEFAULT_COLOR_PALETTE;

  let cardBackgroundColor = swapColor(
    webCard.coverBackgroundColor ?? cardColors.light,
    cardColors,
  );
  let lastModuleBackgroundColor = cardBackgroundColor;
  const lastModule = modules.at(-1);
  const firstModule = modules[0];

  if (firstModule) {
    const firstModuleData = getModuleDataValues({
      data: firstModule.data as any,
      cardStyle: webCard.cardStyle ?? DEFAULT_CARD_STYLE,
      defaultValues:
        MODULES_DEFAULT_VALUES[
          firstModule.kind as keyof typeof MODULES_DEFAULT_VALUES
        ],
      styleValuesMap:
        MODULES_STYLES_VALUES[
          firstModule.kind as keyof typeof MODULES_DEFAULT_VALUES
        ],
    });

    cardBackgroundColor = swapColor(
      firstModuleData.backgroundStyle?.backgroundColor ??
        firstModuleData.cardModuleColor?.background ??
        firstModuleData.colorBottom,
      cardColors,
    );
  }

  webCard.coverBackgroundColor = cardBackgroundColor;

  if (lastModule) {
    const lastModuleData = getModuleDataValues({
      data: lastModule.data as any,
      cardStyle: webCard.cardStyle ?? DEFAULT_CARD_STYLE,
      defaultValues:
        MODULES_DEFAULT_VALUES[
          lastModule.kind as keyof typeof MODULES_DEFAULT_VALUES
        ],
      styleValuesMap:
        MODULES_STYLES_VALUES[
          lastModule.kind as keyof typeof MODULES_DEFAULT_VALUES
        ],
    });

    lastModuleBackgroundColor = swapColor(
      lastModuleData.backgroundStyle?.backgroundColor ??
        lastModuleData.cardModuleColor?.background ??
        lastModuleData.colorBottom,
      cardColors,
    );
  }

  return (
    <WebCardPageLayout
      webCard={webCard}
      posts={posts}
      media={media}
      cover={
        <>
          <CoverRendererBackground media={media} />
          <div
            className={styles.coverContainer}
            style={{
              background: `linear-gradient(to bottom, transparent 0%, ${
                cardBackgroundColor ?? '#FFF'
              } 95%)`,
            }}
          >
            <div
              style={{
                flex: 1,
                background: `linear-gradient(to left, transparent 0%, ${
                  cardBackgroundColor ?? '#FFF'
                } 95%)`,
              }}
            />
            <CoverRenderer webCard={webCard} media={media} priority />
          </div>
        </>
      }
      cardBackgroundColor={cardBackgroundColor}
      lastModuleBackgroundColor={lastModuleBackgroundColor}
      userName={params.userName}
      color={cardBackgroundColor}
    >
      {modules.map(module => (
        <ModuleRenderer
          resizeModes={resizeModes}
          module={module}
          key={module.id}
          colorPalette={cardColors}
          cardStyle={webCard.cardStyle ?? DEFAULT_CARD_STYLE}
          coverBackgroundColor={webCard.coverBackgroundColor}
        />
      ))}
    </WebCardPageLayout>
  );
};

export default ProfilePage;

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const userName = params.userName.toLowerCase();
  const webCard = await cachedGetWebCardByUserName(userName);

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
