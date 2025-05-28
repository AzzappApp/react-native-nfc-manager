import {
  enrichmentByContactLoader,
  profileLoader,
  webCardLoader,
} from '#loaders';
import { filterHiddenContactFields } from '#helpers/contactHelpers';
import { idResolver } from '#helpers/relayIdHelpers';
import type {
  ContactEnrichmentResolvers,
  ContactResolvers,
  EducationResolvers,
  EnrichedContactFieldsResolvers,
  PositionResolvers,
  PublicProfileResolvers,
} from '#/__generated__/types';

export const Position: PositionResolvers = {
  logo: position => {
    return position.logoId
      ? {
          media: position.logoId,
          assetKind: 'logo',
        }
      : null;
  },
};

export const Education: EducationResolvers = {
  logo: education => {
    return education.logoId
      ? {
          media: education.logoId,
          assetKind: 'logo',
        }
      : null;
  },
};

export const EnrichedContactFields: EnrichedContactFieldsResolvers = {
  avatar: contact => {
    return contact.avatarId
      ? {
          media: contact.avatarId,
          assetKind: 'avatar',
        }
      : null;
  },
  logo: contact => {
    return contact.logoId
      ? {
          media: contact.logoId,
          assetKind: 'logo',
        }
      : null;
  },
};

export const PublicProfile: PublicProfileResolvers = {
  skills: profile => {
    return profile.skills
      ? profile.skills.map(skill => ({
          name: skill,
          icon: profile.icons?.[skill] || null,
        }))
      : [];
  },
  interests: profile => {
    return profile.interests
      ? profile.interests.map(interest => ({
          name: interest,
          icon: profile.icons?.[interest] || null,
        }))
      : [];
  },
  location: profile => {
    return profile.country
      ? {
          country: {
            name: profile.country,
            code: profile.countryCode,
          },
          city: profile.city,
        }
      : null;
  },
};

export const ContactEnrichment: ContactEnrichmentResolvers = {
  id: idResolver('ContactEnrichment'),
  fields: enrichment => {
    return enrichment.fields && enrichment.approved !== false
      ? filterHiddenContactFields(enrichment.fields, enrichment.hiddenFields)
      : null;
  },
  publicProfile: enrichment => {
    return enrichment.publicProfile &&
      enrichment.approved !== false &&
      !enrichment.hiddenFields?.profile
      ? enrichment.publicProfile
      : null;
  },
};

export const Contact: ContactResolvers = {
  id: idResolver('Contact'),
  avatar: contact => {
    return contact.avatarId
      ? {
          media: contact.avatarId,
          assetKind: 'avatar',
        }
      : null;
  },
  logo: contact => {
    return contact.logoId
      ? {
          media: contact.logoId,
          assetKind: 'logo',
        }
      : null;
  },
  webCard: async contact => {
    if (contact.contactProfileId) {
      const profile = await profileLoader.load(contact.contactProfileId);
      const webCard = profile
        ? await webCardLoader.load(profile.webCardId)
        : null;
      return webCard;
    }
    return null;
  },
  ownerProfile: contact => {
    return profileLoader.load(contact.ownerProfileId);
  },
  contactProfile: contact => {
    if (contact.contactProfileId) {
      return profileLoader.load(contact.contactProfileId);
    }
    return null;
  },
  enrichment: async contact => {
    if (contact.enrichmentStatus && contact.enrichmentStatus !== 'failed') {
      return enrichmentByContactLoader.load(contact.id);
    }
    return null;
  },
};
