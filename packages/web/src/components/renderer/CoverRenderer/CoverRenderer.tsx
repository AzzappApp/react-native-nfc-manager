import 'server-only';
import { DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';

import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import CoverPreview from './CoverPreview';
import styles from './CoverRenderer.css';
import CoverRendererBackground from './CoverRendererBackground';
import CoverTextRenderer from './CoverTextRenderer';
import type { Media, Profile } from '@azzapp/data/domains';

type CoverRendererProps = Omit<
  React.HTMLProps<HTMLDivElement>,
  'children' | 'media'
> & {
  profile: Profile;
  media: Media;
};

const CoverRenderer = async ({
  profile,
  media,
  style,
  ...props
}: CoverRendererProps) => {
  const { coverData, coverTitle, coverSubTitle, cardColors } = profile;

  if (!coverData) {
    return null;
  }

  return (
    <div
      {...props}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
    >
      <CoverRendererBackground media={media} profile={profile} />
      <div
        {...props}
        style={{
          aspectRatio: `${COVER_RATIO}`,
        }}
        className={styles.content}
      >
        <CoverPreview profile={profile} media={media} {...props} />
        <CoverTextRenderer
          title={coverTitle}
          titleStyle={coverData.titleStyle}
          subTitle={coverSubTitle}
          subTitleStyle={coverData.subTitleStyle}
          colorPalette={cardColors ?? DEFAULT_COLOR_PALETTE}
          textOrientation={coverData.textOrientation}
          textPosition={coverData.textPosition}
        />
      </div>
    </div>
  );
};

export default CoverRenderer;
