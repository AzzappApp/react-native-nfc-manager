import 'server-only';
import { DEFAULT_COLOR_PALETTE } from '@azzapp/shared/cardHelpers';

import CoverPreview from './CoverPreview';
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
  );
};

export default CoverRenderer;
