const SUPPORTED_LOCALES = [
  'en-US',
  'fr',
  // disabled for now
  // 'en-GB',
  // 'da',
  // 'nl',
  'de',
  'it',
  // 'no',
  // 'pt-PT',
  // 'pt-BR',
  'es',
  // 'sv',
];

exports.SUPPORTED_LOCALES = SUPPORTED_LOCALES;
exports.TRANSLATION_TARGETS = ['app', 'web', 'entity'];

exports.APP_TARGET = 'app';
exports.WEB_TARGET = 'web';

const DEFAULT_LOCALE = 'en-US';

exports.DEFAULT_LOCALE = DEFAULT_LOCALE;

exports.isSupportedLocale = string => {
  return typeof string === 'string' && string in SUPPORTED_LOCALES;
};

exports.guessLocale = locale => {
  if (!locale) {
    return DEFAULT_LOCALE;
  }

  if (SUPPORTED_LOCALES.includes(locale)) {
    return locale;
  }

  const language = locale.split('-')[0];
  const found = SUPPORTED_LOCALES.find(supportedLocale =>
    supportedLocale.startsWith(language),
  );

  return found || DEFAULT_LOCALE;
};
