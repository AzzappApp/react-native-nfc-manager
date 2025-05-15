import { isSocialLinkId } from '@azzapp/shared/socialLinkHelpers';
import type { EditionParameters } from '#helpers/mediaEditions';
import type { TextureInfo } from '#helpers/mediaEditions/NativeTextureLoader';
import type {
  SourceMediaVideo,
  SourceMediaImage,
  TimeRange,
} from '#helpers/mediaHelpers';
import type { CoverTextAnimations } from './coverDrawer/coverTextAnimations';
import type { CoverTransitions } from './coverDrawer/coverTransitions';
import type { MediaAnimations } from './coverDrawer/mediaAnimations';
import type { OverlayAnimations } from './coverDrawer/overlayAnimations';
import type { ColorPalette } from '@azzapp/shared/cardHelpers';
import type { Filter } from '@azzapp/shared/filtersHelper';
import type { SocialLinkId } from '@azzapp/shared/socialLinkHelpers';
import type { SkPoint, SkRect } from '@shopify/react-native-skia';

export type CoverEditorState = {
  // Cover data
  isModified: boolean;
  coverId?: string;
  lottie: JSON | null;
  backgroundColor: string | null;

  medias: CoverMedia[];
  initialMediaToPick?: Array<CoverMedia | null>;
  coverTransition: CoverTransitions | null;

  overlayLayers: CoverEditorOverlayItem[];
  textLayers: CoverEditorTextLayerItem[];
  linksLayer: CoverEditorLinksLayerItem;

  cardColors: CardColors;

  // Selection state
  editionMode: CoverEditionMode;
  selectedItemIndex: number | null;

  // Resources used for displaying/updating the cover
  images: Record<string, TextureInfo>;
  imagesScales: Record<string, number>;
  localFilenames: Record<string, string>;
  lutTextures: Partial<Record<Filter, TextureInfo>>;

  // Loading state
  loadingRemoteMedia: boolean;
  loadingLocalMedia: boolean;
  loadingError: any;

  // cover preview informations
  coverPreviewPositionPercentage?: number | null;
  shouldComputeCoverPreviewPositionPercentage: boolean;
  companyActivityLabel?: string | null;
};

export type CardColors = Readonly<
  ColorPalette & {
    otherColors: string[];
  }
>;

export type CoverMediaBase = {
  filter: Filter | null;
  editionParameters: EditionParameters | null;
  editable: boolean;
};

export type CoverMediaVideo = CoverMediaBase &
  SourceMediaVideo & {
    timeRange: TimeRange;
  };

export type CoverMediaImage = CoverMediaBase &
  SourceMediaImage & {
    animation: MediaAnimations | null;
    duration: number;
  };

export type CoverMedia = CoverMediaImage | CoverMediaVideo;

export type CoverEditionMode =
  | 'colors'
  | 'links'
  | 'media'
  | 'mediaEdit'
  | 'none'
  | 'overlay'
  | 'text'
  | 'textEdit';

export type CoverEditionProvidedMedia = CoverMediaImage & {
  index: number;
  editable: boolean;
};

export type CoverEditorTextLayerItem = {
  text: string;
  fontFamily: string;
  fontSize: number;
  textAlign: 'center' | 'left' | 'right';
  color: string;
  position: SkPoint;
  width: number;
  rotation: number;
  shadow: boolean;
  animation: CoverTextAnimations | null;
  startPercentageTotal: number;
  endPercentageTotal: number;
};

export type CoverEditorOverlayItem = SourceMediaImage & {
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  elevation: number;
  animation: OverlayAnimations | null;
  startPercentageTotal: number;
  endPercentageTotal: number;
  filter: Filter | null;
  editionParameters: EditionParameters | null;
  bounds: SkRect;
  rotation: number;
  shadow: boolean;
};

export type CoverEditorSocialLink = {
  link: string;
  position: number;
  socialId: SocialLinkId;
};

export const isSocialLink = (item: {
  socialId: string;
  link: string;
  position: number;
}): item is CoverEditorSocialLink => {
  return isSocialLinkId(item.socialId);
};

export type CoverEditorLinksLayerItem = {
  links: CoverEditorSocialLink[];
  color: string;
  size: number;
  position: SkPoint;
  rotation: number;
  shadow: boolean;
};
