import * as Sentry from '@sentry/nextjs';
import isEqual from 'lodash/isEqual';
import {
  transaction,
  saveContactEnrichment,
  incrementNbEnrichments,
  updateContactEnrichment,
  referencesMedias,
  type Contact,
  type PublicProfile,
  type EnrichedContactFields,
} from '@azzapp/data';
import { checkMedias } from '@azzapp/service/mediaServices/mediaServices';
import { isDefined } from '@azzapp/shared/isDefined';
import { cleanObject } from '@azzapp/shared/objectHelpers';
import env from './env';
import { evaluateExpr, describeDependsOn, extractFieldPaths } from './helpers';
import { countryCode } from './provider/countryCode';
import { githubAvatar } from './provider/github';
import { ipqualityscore } from './provider/ipqualityscore';
import * as pdl from './provider/peopledatalab';
import { perplexity, perplexityIcons } from './provider/perplexity';
import * as proxycurl from './provider/proxycurl';
import * as unavatar from './provider/unavatar';
import type { ApiResolver, EnrichedData } from './types';

// Compares original and updated values, and returns only new fields or new array values
function diffValues<T extends Record<string, any>>(
  original: Partial<T>,
  updated: Partial<T>,
): Partial<T> {
  let result: Partial<T> = {};
  for (const [key, newVal] of Object.entries(updated)) {
    const oldVal = original[key];
    if (Array.isArray(newVal) && Array.isArray(oldVal)) {
      const additions = newVal.filter(
        v => !oldVal.some((o: unknown) => isEqual(v, o)),
      );
      if (additions.length > 0) {
        result = {
          ...result,
          [key]: additions,
        };
      }
    } else if (!oldVal && newVal) {
      result = {
        ...result,
        [key]: newVal,
      };
    }
  }
  return result;
}

export type EnrichResult = {
  enriched: EnrichedData;
  trace: Record<string, string>; // field -> resolver name
};

// Main enrichContact function: applies API resolvers to enrich missing contact/profile fields
export const enrichContact = async (
  userId: string,
  initial: {
    contact: Contact;
  },
  maxRounds = 5,
): Promise<EnrichResult> => {
  const initialContact = initial.contact ?? {};
  const initialProfile = {};

  const current = {
    contact: { ...initial.contact } as EnrichedContactFields,
    profile: {} as PublicProfile,
  };

  const enriched: EnrichedData = {
    contact: {},
    profile: {},
  };

  const trace: Record<string, string> = {};
  const usedResolvers = new Set<string>();

  let enrichmentId: string;

  const resolvers: ApiResolver[] = [
    githubAvatar,
    pdl.peopleDataLabsIdentify,
    pdl.peopleDataLabsEnrichment,
    proxycurl.proxyCurlLookup,
    proxycurl.proxyCurlProfile,
    proxycurl.proxyCurlPicture,
    unavatar.unAvatar,
    countryCode,
    perplexity,
    perplexityIcons,
    ipqualityscore,
  ];

  for (let round = 0; round < maxRounds; round++) {
    // Filter eligible resolvers based on whether they can provide missing fields
    const candidates = resolvers
      .filter(r => !usedResolvers.has(r.name))
      .filter(r => evaluateExpr(current, r.dependsOn))
      .filter(r => {
        const providesContact = r.provides.contact ?? [];
        const providesProfile = r.provides.profile ?? [];
        return (
          providesContact.some(
            field =>
              current.contact[field] === undefined ||
              current.contact[field] === null ||
              (typeof current.contact[field] === 'string' &&
                !current.contact[field].trim()) ||
              (Array.isArray(current.contact[field]) &&
                current.contact[field].filter(isDefined).length === 0),
          ) ||
          providesProfile.some(
            field =>
              current.profile[field] === undefined ||
              current.profile[field] === null ||
              (Array.isArray(current.profile[field]) &&
                current.profile[field].filter(isDefined).length === 0),
          )
        );
      })
      .sort((a, b) => a.priority - b.priority);

    if (candidates.length === 0) break;
    for (const resolver of candidates) {
      try {
        if (env.ENABLE_ENRICHMENT_MONITORING === 'true') {
          const dependsDescription = describeDependsOn(resolver.dependsOn);
          const paths = extractFieldPaths(resolver.dependsOn);
          const inputSummary = paths
            .map(path => {
              const [section, key] = path.split('.') as [
                'contact' | 'profile',
                string,
              ];
              const value = (current[section] as any)?.[key];
              return `${path}=${JSON.stringify(value)}`;
            })
            .join(', ');

          console.log(
            `[ENRICHMENT] Resolver: ${resolver.name} | DependsOn: ${dependsDescription} | Priority: ${resolver.priority}`,
          );
          if (inputSummary) {
            console.log(`            → With inputs: ${inputSummary}`);
          }
        }

        const previousMediaIds = [
          enriched.contact.avatarId,
          enriched.contact.logoId,
          ...(enriched.profile?.positions?.map(p => p.logoId) ?? []),
          ...(enriched.profile?.education?.map(e => e.logoId) ?? []),
        ].filter(isDefined);

        const {
          data,
          error,
          shouldRetry = false,
          mediaPromises,
        } = await resolver.run(current);

        const { contact = {}, profile = {} } = data ?? {};

        // Log errors to Sentry, excluding 404s
        if (error && error.httpStatusCode && error.httpStatusCode !== 404) {
          Sentry.captureMessage(
            `Error in resolver ${resolver.name}: ${error.message}`,
            {
              extra: {
                httpStatusCode: error.httpStatusCode,
              },
            },
          );
        }

        const newContact = cleanObject(diffValues(initialContact, contact));
        const newProfile = cleanObject(diffValues(initialProfile, profile));

        if (Object.keys(newContact).length > 0) {
          enriched.contact = { ...enriched.contact, ...newContact };
          current.contact = { ...current.contact, ...newContact };
          for (const k of Object.keys(newContact))
            trace[`contact.${k}`] = resolver.name;
        }
        if (Object.keys(newProfile).length > 0) {
          enriched.profile = { ...enriched.profile, ...newProfile };
          current.profile = { ...current.profile, ...newProfile };
          for (const k of Object.keys(newProfile))
            trace[`profile.${k}`] = resolver.name;
        }

        const medias = [
          enriched.contact.avatarId,
          enriched.contact.logoId,
          ...(enriched.profile?.positions?.map(p => p.logoId) ?? []),
          ...(enriched.profile?.education?.map(e => e.logoId) ?? []),
        ].filter(isDefined);

        await checkMedias(medias);

        if (Object.keys(trace).length > 0) {
          await transaction(async () => {
            await referencesMedias(medias, previousMediaIds);
            if (!enrichmentId) {
              enrichmentId = await saveContactEnrichment({
                contactId: initialContact.id,
                fields: enriched.contact,
                publicProfile: enriched.profile,
                trace,
              });
              await incrementNbEnrichments(userId);
            } else {
              await updateContactEnrichment(enrichmentId, {
                fields: enriched.contact,
                publicProfile: enriched.profile,
                trace,
              });
            }
          });

          if (mediaPromises) {
            const result = await Promise.allSettled(
              Array.from(mediaPromises.entries()).map(
                async ([mediaId, mediaPromise]) => {
                  await mediaPromise;
                  return mediaId;
                },
              ),
            );

            const successfulMediaIds = result
              .map(r => (r.status === 'fulfilled' ? r.value : null))
              .filter(isDefined);

            if (enriched.profile?.positions) {
              enriched.profile.positions = finalizeLogos(
                enriched.profile.positions,
                successfulMediaIds,
              );
            }

            if (enriched.profile?.education) {
              enriched.profile.education = finalizeLogos(
                enriched.profile.education,
                successfulMediaIds,
              );
            }
            await checkMedias(successfulMediaIds);
            await transaction(async () => {
              await referencesMedias(successfulMediaIds, null);
              await updateContactEnrichment(enrichmentId, {
                fields: enriched.contact,
                publicProfile: enriched.profile,
              });
            });
          }
        }

        if (!shouldRetry) usedResolvers.add(resolver.name);
      } catch (error) {
        usedResolvers.add(resolver.name);
        console.error(
          `Error in resolver ${resolver.name}: ${JSON.stringify(error)}`,
          error,
        );
        Sentry.captureException(error);
      }
    }
  }

  return { enriched, trace };
};

function finalizeLogos<T extends { tempLogoId?: string | null }>(
  items: T[] | undefined,
  successfulIds: string[],
): Array<Omit<T, 'tempLogoId'> & { logoId?: string | null }> | undefined {
  return items?.map(item => {
    const { tempLogoId, ...rest } = item;
    return {
      ...rest,
      ...(tempLogoId && successfulIds.includes(tempLogoId)
        ? { logoId: tempLogoId }
        : {}),
    };
  });
}
