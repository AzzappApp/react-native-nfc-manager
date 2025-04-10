import { getProfileById, getUserById } from '@azzapp/data';
import { DEFAULT_LOCALE, isSupportedLocale } from '@azzapp/i18n';
import { generateEmailSignature } from '@azzapp/service/emailSignatureServices';
import { getServerIntl } from '#helpers/i18nHelpers';
import { inngest } from '../client';

export const sendEmailSignatureBatch = inngest.createFunction(
  { id: 'emailSignatureBatch' },
  { event: 'batch/emailSignature' },
  async ({ event, step }) => {
    const profileIds = event.data.profileIds;

    for (const profileId of profileIds) {
      await step.sendEvent(`send-email-${profileId}`, {
        name: 'send/emailSignature',
        data: {
          profileId,
          webCard: event.data.webCard,
        },
      });
    }

    return { queued: profileIds.length };
  },
);

export const sendEmailSignature = inngest.createFunction(
  { id: 'emailSignature' },
  { event: 'send/emailSignature' },
  async ({ event }) => {
    const { profileId, webCard } = event.data;

    const profile = await getProfileById(profileId);
    if (profile) {
      const user = await getUserById(profile.userId);
      const locale = isSupportedLocale(user?.locale)
        ? user?.locale
        : DEFAULT_LOCALE;
      await generateEmailSignature({
        profile,
        webCard,
        intl: getServerIntl(locale),
      });
    }

    return { sent: true };
  },
);
