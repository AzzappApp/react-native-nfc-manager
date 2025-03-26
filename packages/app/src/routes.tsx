import isEqual from 'lodash/isEqual';
import type { ModuleKindWithVariant } from '#helpers/webcardModuleHelpers';
import type { SectionsRoute } from './sectionsRoutes';
import type { ColorPaletteColor } from '@azzapp/shared/cardHelpers';
import type { ModuleKind } from '@azzapp/shared/cardModuleHelpers';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';
import type { Contact } from 'expo-contacts';
import type { LayoutRectangle } from 'react-native';
export type AboutRoute = {
  route: 'ABOUT';
  params?: never;
};

export type HomeRoute = {
  route: 'HOME';
  params?: {
    openShakeShare?: boolean;
  };
};

export type MediaRoute = {
  route: 'MEDIA';
  params?: never;
};

export type SearchRoute = {
  route: 'SEARCH';
  params?: never;
};

export type SignInRoute = {
  route: 'SIGN_IN';
  params?: never;
};

export type SignUpRoute = {
  route: 'SIGN_UP';
  params?: never;
};

export type ConfirmRegistrationRoute = {
  route: 'CONFIRM_REGISTRATION';
  params: {
    issuer: string;
  };
};

export type AcceptTermsRoute = {
  route: 'ACCEPT_TERMS';
  params?: never;
};

export type ForgotPasswordRoute = {
  route: 'FORGOT_PASSWORD';
  params?: never;
};

export type ForgotPasswordConfirmationRoute = {
  route: 'FORGOT_PASSWORD_CONFIRMATION';
  params: {
    issuer: string;
  };
};

export type CoverTemplateSelectionRoute = {
  route: 'COVER_TEMPLATE_SELECTION';
  params?: {
    fromCoverEdition?: boolean;
    fromHome?: boolean;
  };
};

export type CoverCreationRoute = {
  route: 'COVER_CREATION';
  params: {
    fromCoverEdition?: boolean;
    templateId?: string;
    color?: ColorPaletteColor;
  };
};

export type WebCardTemplateSelectionRoute = {
  route: 'WEBCARD_TEMPLATE_SELECTION';
  params?: never;
};

export type WebCardRoute = {
  route: 'WEBCARD';
  params: {
    fromRectangle?: LayoutRectangle;
    showPosts?: boolean;
    contactData?: string | null;
    additionalContactData?: Pick<ContactCard, 'socials' | 'urls'> & {
      avatarUrl?: string;
      geolocation?: {
        location: {
          latitude: number;
          longitude: number;
        };
        address?: {
          city: string;
          country: string;
          subregion: string;
          region: string;
        };
      };
    };
    fromCreation?: boolean;
    editing?: boolean;
  } & (
    | {
        userName: string;
        webCardId?: string | null;
      }
    | {
        userName?: string | null;
        webCardId: string;
      }
  );
};

export type PostRoute = {
  route: 'POST';
  params: {
    postId: string;
    videoTime?: number | null;
    fromRectangle?: LayoutRectangle;
  };
};

export type PostCommentsRoute = {
  route: 'POST_COMMENTS';
  params: {
    postId: string;
  };
};

export type PostLikesRoute = {
  route: 'POST_LIKES';
  params: {
    postId: string;
  };
};

export type NewPostRoute = {
  route: 'NEW_POST';
  params?: { fromProfile: boolean };
};

export type CoverEditionRoute = {
  route: 'COVER_EDITION';
  params?: { isCreation?: boolean; coverKind?: 'others' | 'people' | 'video' };
};

export type CardModuleEditionRoute = {
  route: 'CARD_MODULE_EDITION';
  params: {
    module: ModuleKind;
    moduleId?: string;
    isNew?: boolean;
  };
};

export type FollowingsRoute = {
  route: 'FOLLOWINGS';
  params?: never;
};

export type FollowingsMosaicRoute = {
  route: 'FOLLOWINGS_MOSAIC';
  params?: never;
};

export type FollowersRoute = {
  route: 'FOLLOWERS';
  params?: never;
};

export type LikedPostsRoute = {
  route: 'LIKED_POSTS';
  params?: never;
};

export type AccountDetailsRoute = {
  route: 'ACCOUNT_DETAILS';
  params?: never;
};

export type InviteFriendsRoute = {
  route: 'INVITE_FRIENDS';
  params?: never;
};

export type ResetPasswordRoute = {
  route: 'RESET_PASSWORD';
  params: {
    token: string;
    issuer: string;
  };
};

export type AddModuleSectionRoute = {
  route: 'ADD_MODULE_SECTION';
  params: {
    webCardId: string;
  };
};

export type OnboardingRoute = {
  route: 'ONBOARDING';
  params?: never;
};

export type MultiUserRoute = {
  route: 'MULTI_USER';
  params?: never;
};

export type MultiUserAddRoute = {
  route: 'MULTI_USER_ADD';
  params?: never;
};

export type WebCardParametersRoute = {
  route: 'WEBCARD_PARAMETERS';
  params?: never;
};

export type ConfirmChangeContactRoute = {
  route: 'CONFIRM_CHANGE_CONTACT';
  params: {
    issuer: string;
  };
};

export type UserPayWallRoute = {
  route: 'USER_PAY_WALL';
  params?: {
    activateFeature: 'MULTI_USER';
  };
};

export type CommonInformationRoute = {
  route: 'COMMON_INFORMATION';
  params?: never;
};

export type ContactCardEditRoute = {
  route: 'CONTACT_CARD_EDIT';
  params?: never;
};

export type ContactCardCreateRoute = {
  route: 'CONTACT_CARD_CREATE';
  params?: {
    launchedFromWelcomeScreen: boolean;
  };
};

export type ContactCreateRoute = {
  route: 'CONTACT_CREATE';
  params?: {
    showCardScanner?: boolean;
    vCardUri?: string;
  };
};

export type MultiUserDetailRoute = {
  route: 'MULTI_USER_DETAIL';
  params: {
    profileId: string;
  };
};

export type EmailSignatureRoute = {
  route: 'EMAIL_SIGNATURE';
  params: {
    userName: string;
    mode: string;
    compressedContactCard: string;
  };
};

export type ContactsRoute = {
  route: 'CONTACTS';
  params?: never;
};

export type ContactDetailsRoute = {
  route: 'CONTACT_DETAILS';
  params: Contact & {
    createdAt: Date;
    profileId?: string;
  };
};

export type OfflineVCardRoute = {
  route: 'OFFLINE_VCARD';
  params?: {
    canGoBack?: boolean;
  };
};

export type ModulePreviewRoute = {
  route: 'MODULE_PREVIEW';
  params: {
    variant: ModuleKindWithVariant;
  };
};

export type ContactByLocationRoute = {
  route: 'CONTACTS_BY_LOCATION';
  params: {
    location: string;
  };
};

export type Route =
  | AboutRoute
  | AcceptTermsRoute
  | AccountDetailsRoute
  | AddModuleSectionRoute
  | CardModuleEditionRoute
  | CommonInformationRoute
  | ConfirmChangeContactRoute
  | ConfirmRegistrationRoute
  | ContactByLocationRoute
  | ContactCardCreateRoute
  | ContactCardEditRoute
  | ContactCreateRoute
  | ContactDetailsRoute
  | ContactsRoute
  | CoverCreationRoute
  | CoverEditionRoute
  | CoverTemplateSelectionRoute
  | EmailSignatureRoute
  | FollowersRoute
  | FollowingsMosaicRoute
  | FollowingsRoute
  | ForgotPasswordConfirmationRoute
  | ForgotPasswordRoute
  | HomeRoute
  | InviteFriendsRoute
  | LikedPostsRoute
  | MediaRoute
  | ModulePreviewRoute
  | MultiUserAddRoute
  | MultiUserDetailRoute
  | MultiUserRoute
  | NewPostRoute
  | OfflineVCardRoute
  | OnboardingRoute
  | PostCommentsRoute
  | PostLikesRoute
  | PostRoute
  | ResetPasswordRoute
  | SearchRoute
  | SectionsRoute
  | SignInRoute
  | SignUpRoute
  | UserPayWallRoute
  | WebCardParametersRoute
  | WebCardRoute
  | WebCardTemplateSelectionRoute;

export type ROUTES = Route['route'];

export const isRouteEqual = (route: Route, compareRoute: Route) => {
  if (route.route !== compareRoute.route) {
    return false;
  }
  if (route.route === 'POST' && compareRoute.route === 'POST') {
    return route.params.postId === compareRoute.params.postId;
  }
  if (route.route === 'WEBCARD' && compareRoute.route === 'WEBCARD') {
    return (
      route.params.userName === compareRoute.params.userName &&
      route.params.webCardId === compareRoute.params.webCardId
    );
  }
  return isEqual(route.params, compareRoute.params);
};
