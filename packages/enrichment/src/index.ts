import * as Sentry from '@sentry/nextjs';
import isEqual from 'lodash/isEqual';
import { isDefined } from '@azzapp/shared/isDefined';
import { cleanObject } from '@azzapp/shared/objectHelpers';
import { evaluateExpr } from './helpers';
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

// Main enrichContact function: applies API resolvers to enrich missing contact/profile fields
export const enrichContact = async (
  initial: EnrichedData,
  maxRounds = 5,
): Promise<{
  enriched: EnrichedData;
  trace: Record<string, string>; // field -> resolver name
}> => {
  const initialContact = initial.contact ?? {};
  const initialProfile = initial.profile ?? {};

  const current = {
    contact: { ...initial.contact },
    profile: { ...initial.profile },
  };

  const enriched: EnrichedData = {
    contact: {},
    profile: {},
  };

  const trace: Record<string, string> = {};
  const usedResolvers = new Set<string>();

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
              (typeof current.contact[field] === 'string' &&
                !current.contact[field].trim()) ||
              (Array.isArray(current.contact[field]) &&
                current.contact[field].filter(isDefined).length === 0),
          ) ||
          providesProfile.some(
            field =>
              current.profile[field] === undefined ||
              (Array.isArray(current.profile[field]) &&
                current.profile[field].filter(isDefined).length === 0),
          )
        );
      })
      .sort((a, b) => a.priority - b.priority);

    if (candidates.length === 0) break;

    for (const resolver of candidates) {
      try {
        const {
          data,
          error,
          shouldRetry = false,
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
          current.contact = { ...current.contact, ...contact };
          for (const k of Object.keys(newContact))
            trace[`contact.${k}`] = resolver.name;
        }
        if (Object.keys(newProfile).length > 0) {
          enriched.profile = { ...enriched.profile, ...newProfile };
          current.profile = { ...current.profile, ...profile };
          for (const k of Object.keys(newProfile))
            trace[`profile.${k}`] = resolver.name;
        }

        if (!shouldRetry) usedResolvers.add(resolver.name);
      } catch (error) {
        usedResolvers.add(resolver.name);
        console.error(`Error in resolver ${resolver.name}: ${error}`, error);
        Sentry.captureException(error);
      }
    }
  }

  return { enriched, trace };
};
