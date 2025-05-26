import AboutScreen from '#screens/AboutScreen';
import AcceptTermsScreen from '#screens/AcceptTermsScreen';
import AccountDetailsScreen from '#screens/AccountDetailsScreen';
import CardModuleEditionScreen from '#screens/CardModuleEditionScreen';
import CommonInformationScreen from '#screens/CommonInformationScreen';
import ConfirmChangeContactScreen from '#screens/ConfirmChangeContactScreen';
import ConfirmRegistrationScreen from '#screens/ConfirmRegistrationScreen';
import ContactCardEditScreen from '#screens/ContactCardEditScreen';
import ContactCardCreateScreen from '#screens/ContactCardEditScreen/ContactCardCreateScreen';
import ContactCreateScreen from '#screens/ContactCreateScreen/ContactCreateScreen';
import ContactDetailsScreen from '#screens/ContactDetailsScreen';
import ContactEditScreen from '#screens/ContactEditScreen/ContactEditScreen';
import ContactsFilteredListScreen from '#screens/ContactsFilteredListScreen';
import ContactsScreen from '#screens/ContactsScreen';
import CookieContentScreen from '#screens/CookieConsentsScreen';
import CookieSettingsScreen from '#screens/CookieSettingsScreen';
import CoverCreationScreen from '#screens/CoverCreationScreen';
import CoverEditionScreen from '#screens/CoverEditionScreen';
import CoverTemplateSelectionScreen from '#screens/CoverTemplateSelectionScreen';
import EmailSignatureScreen from '#screens/EmailSignatureScreen';
import FollowersScreen from '#screens/FollowersScreen';
import FollowingsMosaicScreen from '#screens/FollowingsMosaicScreen';
import FollowingsScreen from '#screens/FollowingsScreen';
import ForgotPasswordConfirmationScreen from '#screens/ForgotPasswordConfirmationScreen';
import ForgotPasswordScreen from '#screens/ForgotPasswordScreen';
import HomeScreen from '#screens/HomeScreen';
import WelcomeScreen from '#screens/HomeScreen/WelcomeScreen';
import InviteFriendsScreen from '#screens/InviteFriendsScreen';
import LikedPostsScreen from '#screens/LikedPostsScreen';
import MediaModuleWebCardEditionScreen from '#screens/MediaModuleWebCardEditionScreen';
import MediaScreen from '#screens/MediaScreen';
import MediaTextLinkModuleWebCardEditionScreen from '#screens/MediaTextLinkModuleWebCardEditionScreen';
import MediaTextModuleWebCardEditionScreen from '#screens/MediaTextModuleWebCardEditionScreen';
import MultiUserAddScreen from '#screens/MultiUserAddScreen';
import MultiUserDetailsScreen from '#screens/MultiUserDetailsScreen';
import MultiUserScreen from '#screens/MultiUserScreen';
import OfflineVCardScreen from '#screens/OfflineVCardScreen';
import PostCommentsMobileScreen from '#screens/PostCommentsScreen';
import PostCreationScreen from '#screens/PostCreationScreen';
import PostLikesScreen from '#screens/PostLikesScreen/PostLikesScreen';
import PostScreen from '#screens/PostScreen';
import ResetPasswordScreen from '#screens/ResetPasswordScreen';
import SearchScreen from '#screens/SearchScreen';
import ShakeAndShareScreen from '#screens/ShakeAndShareScreen';
import SignInScreen from '#screens/SignInScreen';
import SignUpScreen from '#screens/SignUpScreen';
import TitleTextModuleWebCardEditionScreen from '#screens/TitleTextModuleWebCardEditionScreen';
import UserPayWallScreen from '#screens/UserPayWallScreen';
import AddModuleSectionScreen from '#screens/WebCardEditScreen/AddModuleSection';
import CardModuleConfirmationScreen from '#screens/WebCardEditScreen/AddModuleSection/CardModuleConfirmationScreen';
import WebCardParametersScreen from '#screens/WebCardParametersScreen';
import WebCardScreen from '#screens/WebCardScreen';
import WebCardTemplateSelectionScreen from '#screens/WebCardTemplateSelectionScreen';
import type { ScreenMap } from '#components/NativeRouter';

// #region Routing Definitions
const screens = {
  ABOUT: AboutScreen,
  ACCOUNT_DETAILS: AccountDetailsScreen,
  ACCEPT_TERMS: AcceptTermsScreen,
  CARD_MODULE_EDITION: CardModuleEditionScreen,
  CARD_MODULE_MEDIA_EDITION: MediaModuleWebCardEditionScreen,
  CARD_MODULE_MEDIA_TEXT_EDITION: MediaTextModuleWebCardEditionScreen,
  CARD_MODULE_MEDIA_TEXT_LINK_EDITION: MediaTextLinkModuleWebCardEditionScreen,
  CARD_MODULE_TITLE_TEXT_EDITION: TitleTextModuleWebCardEditionScreen,
  CONTACT_CARD_EDIT: ContactCardEditScreen,
  CONTACT_CARD_CREATE: ContactCardCreateScreen,
  CONTACT_CREATE: ContactCreateScreen,
  CONTACT_EDIT: ContactEditScreen,
  CONFIRM_CHANGE_CONTACT: ConfirmChangeContactScreen,
  COMMON_INFORMATION: CommonInformationScreen,
  CONTACTS: ContactsScreen,
  OFFLINE_VCARD: OfflineVCardScreen,
  CONTACT_DETAILS: ContactDetailsScreen,
  ADD_MODULE_SECTION: AddModuleSectionScreen,
  MODULE_PREVIEW: CardModuleConfirmationScreen,
  COOKIE_CONSENT: CookieContentScreen,
  COOKIE_SETTINGS: CookieSettingsScreen,
  COVER_CREATION: CoverCreationScreen,
  COVER_EDITION: CoverEditionScreen,
  COVER_TEMPLATE_SELECTION: CoverTemplateSelectionScreen,
  EMAIL_SIGNATURE: EmailSignatureScreen,
  FOLLOWINGS: FollowingsScreen,
  FOLLOWINGS_MOSAIC: FollowingsMosaicScreen,
  FOLLOWERS: FollowersScreen,
  FORGOT_PASSWORD: ForgotPasswordScreen,
  FORGOT_PASSWORD_CONFIRMATION: ForgotPasswordConfirmationScreen,
  HOME: HomeScreen,
  INVITE_FRIENDS: InviteFriendsScreen,
  LIKED_POSTS: LikedPostsScreen,
  MULTI_USER: MultiUserScreen,
  MULTI_USER_ADD: MultiUserAddScreen,
  MULTI_USER_DETAIL: MultiUserDetailsScreen,
  MEDIA: MediaScreen,
  NEW_POST: PostCreationScreen,
  ONBOARDING: WelcomeScreen,
  POST: PostScreen,
  POST_COMMENTS: PostCommentsMobileScreen,
  POST_LIKES: PostLikesScreen,
  RESET_PASSWORD: ResetPasswordScreen,
  SIGN_IN: SignInScreen,
  SIGN_UP: SignUpScreen,
  CONFIRM_REGISTRATION: ConfirmRegistrationScreen,
  SEARCH: SearchScreen,
  USER_PAY_WALL: UserPayWallScreen,
  WEBCARD: WebCardScreen,
  WEBCARD_PARAMETERS: WebCardParametersScreen,
  WEBCARD_TEMPLATE_SELECTION: WebCardTemplateSelectionScreen,
  CONTACTS_BY_LOCATION: ContactsFilteredListScreen,
  CONTACTS_BY_DATE: ContactsFilteredListScreen,
  SHAKE_AND_SHARE: ShakeAndShareScreen,
} satisfies ScreenMap;

export default screens;
