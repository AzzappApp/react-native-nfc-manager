import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { getWebCardByUserName } from '@azzapp/data';
import { buildCoverImageUrl } from '@azzapp/service/mediaServices';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';

const COVER_WIDTH = 180;
const OG_WIDTH = 720;
const OG_HEIGHT = 378;

const width = COVER_WIDTH;
const height = COVER_WIDTH / COVER_RATIO;
const bgHeight = OG_WIDTH / COVER_RATIO;
const percentDiffHeight = ((bgHeight - OG_HEIGHT) / bgHeight) * 50;

export async function GET(
  _request: Request,
  props: { params: Promise<{ userName: string }> },
) {
  const params = await props.params;
  const userName = params.userName.toLowerCase();
  const webCard = await getWebCardByUserName(userName);

  const coverUrl = await buildCoverImageUrl(webCard, {
    width,
    height,
    crop: 'fit',
  });

  if (!webCard.coverMediaId || !webCard.cardIsPublished) {
    return notFound();
  }

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: OG_WIDTH,
          height: OG_HEIGHT,
        }}
      >
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: 0,
            left: 0,
            width: OG_WIDTH,
            height: OG_HEIGHT,
          }}
        >
          <img
            src={coverUrl}
            alt=""
            style={{
              objectFit: 'cover',
              transform: `translateY(-${percentDiffHeight}%)`,
              filter: 'blur(8px)',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            borderRadius: 21,
            width,
            height,
            overflow: 'hidden',
            boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.20)',
          }}
        >
          <img src={coverUrl} alt="" width={COVER_WIDTH} height={height} />
        </div>
      </div>
    ),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
    },
  );
}
