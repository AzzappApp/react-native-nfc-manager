/**
 * Errors that the API may return in case of invalid call.
 */
const ERRORS = {
  /**
   * The request is invalid.
   * This may happen if the request is malformed or if the request is missing some required parameters.
   */
  INVALID_REQUEST: 'INVALID_REQUEST',
  /**
   * The email is already used by another user.
   * This may happen when a user tries to register with an email that is already used by another user.
   */
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  /**
   * The phone number is already used by another user.
   * This may happen when a user tries to register with a phone number that is already used by another user.
   */
  PHONENUMBER_ALREADY_EXISTS: 'PHONENUMBER_ALREADY_EXISTS',
  /**
   * The email is not valid.
   * This may happen when a user tries to register with an email that is not valid.
   */
  EMAIL_NOT_VALID: 'EMAIL_NOT_VALID',
  /**
   * The password is not valid.
   * This may happen when a user tries to register with a password that is not valid.
   */
  PASSWORD_NOT_VALID: 'PASSWORD_NOT_VALID',
  /**
   * The phone number is not valid.
   * This may happen when a user tries to register with a phone number that is not valid.
   */
  PHONENUMBER_NOT_VALID: 'PHONENUMBER_NOT_VALID',
  /**
   * The username is already used by another user.
   * This may happen when a user tries to create a profile with a username that is already used by another user.
   */
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',
  /**
   * The username cannot be changed
   * This may happen when a user tries to change is userName to often(minimum delay between change not fill).
   */
  USERNAME_CHANGE_NOT_ALLOWED_DELAY: 'USERNAME_CHANGE_NOT_ALLOWED_DELAY',
  /**
   * The requested resource was not found.
   * This may happen when a user tries to access a resource that does not exist.
   */
  NOT_FOUND: 'NOT_FOUND',
  /**
   * The provided credentials are invalid.
   * This may happen when a user tries to login with invalid credentials.
   */
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  /**
   * The provided token is invalid.
   * This may happen when a user tries to use an invalid or expired token to access a protected resource.
   */
  INVALID_TOKEN: 'INVALID_TOKEN',
  /**
   * Unauthorized access.
   * This may happen when a user tries to access a protected resource without being authenticated.
   */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /**
   * Forbidden access.
   * This may happen when a user tries to access a protected resource without the required permissions.
   */
  FORBIDDEN: 'FORBIDDEN',
  /**
   * Internal server error.
   * This may happen when the server encounters an unexpected error.
   */
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  /**
   * The JSON decoding failed.
   * This may happen when we try to decode a JSON string that is not valid.
   */
  JSON_DECODING_ERROR: 'JSON_DECODING_ERROR',
  /**
   * The BLOB decoding failed.
   * This may happen when we try to decode a BLOB string that is not valid.
   */
  BLOB_DECODING_ERROR: 'BLOB_DECODING_ERROR',
  /**
   * GraphQL error.
   * Error message used to wrap GraphQL errors.
   */
  GRAPHQL_ERROR: 'GRAPHQL_ERROR',
  /**
   * The version of the app is not supported.
   * This may happen when the user is using an old version of the app that is not supported anymore.
   */
  UPDATE_APP_VERSION: 'UPDATE_APP_VERSION',
  /**
   * The profile already exist.
   * This may happen when a user is invited to a multi-user webcard, but is already a member.
   */
  PROFILE_ALREADY_EXISTS: 'PROFILE_ALREADY_EXISTS',
  /**
   * The profile does not exist.
   * This may happen when an action is triggered for a given profile, which is not part of a webcard anymore.
   */
  PROFILE_DONT_EXISTS: 'PROFILE_DONT_EXISTS',
  /**
   * The webCard is not published.
   */
  UNPUBLISHED_WEB_CARD: 'UNPUBLISHED_WEB_CARD',
  /**
   * The payload is too large.
   */
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  /**
   * The payment failed.
   */
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  /**
   * The subscription is required.
   */
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',

  SUBSCRIPTION_INSUFFICIENT_SEATS: 'SUBSCRIPTION_INSUFFICIENT_SEATS',
  /**
   * The subscription is active.
   */
  SUBSCRIPTION_IS_ACTIVE: 'SUBSCRIPTION_IS_ACTIVE',
  /**
   * The webCard userName is not valid
   */
  INVALID_WEBCARD_USERNAME: 'INVALID_WEBCARD_USERNAME',
  /**
   * The webCard cover media is missing
   */
  MISSING_COVER: 'MISSING_COVER',
  /**
   * The reaction is not allowed
   */
  REACTION_NOT_ALLOWED: 'REACTION_NOT_ALLOWED',
} as const;

export default ERRORS;
