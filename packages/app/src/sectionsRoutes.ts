import type { Variant } from '#helpers/webcardModuleHelpers';

export type MediaSectionRoute = {
  route: 'CARD_MODULE_MEDIA_EDITION';
  params: { variant: Variant<'media'>; moduleId?: string };
};

export type MediaTextSectionRoute = {
  route: 'CARD_MODULE_MEDIA_TEXT_EDITION';
  params: { variant: Variant<'mediaText'>; moduleId?: string };
};

export type MediaTextLinkSectionRoute = {
  route: 'CARD_MODULE_MEDIA_TEXT_LINK_EDITION';
  params: { variant: Variant<'mediaTextLink'>; moduleId?: string };
};

export type SectionsRoute =
  | MediaSectionRoute
  | MediaTextLinkSectionRoute
  | MediaTextSectionRoute;
/**
 * The type `MediaSectionRoute` represents a route for editing media content within a card module.
 * @property route - The `route` property in the `MediaSectionRoute` type specifies the specific route
 * for a media card module edition. In this case, the route is `'CARD_MODULE_MEDIA_EDITION'`.
 * @property params - The `params` property in the `MediaSectionRoute` type includes two
 * sub-properties:
 */
