const SUPPORTED_LOCALES = [
  'en-US',
  'en-GB',
  'fr',
  'da',
  'nl',
  'de',
  'it',
  'no',
  'pt-PT',
  'pt-BR',
  'es',
  'sv',
];

exports.SUPPORTED_LOCALES = SUPPORTED_LOCALES;

exports.DEFAULT_LOCALE = 'en-US';

exports.isSupportedLocale = string => {
  return typeof string === 'string' && string in SUPPORTED_LOCALES;
};
