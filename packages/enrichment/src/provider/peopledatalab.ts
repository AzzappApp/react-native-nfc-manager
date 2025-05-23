import PDLJS from 'peopledatalabs';
import { isSocialLinkId } from '@azzapp/shared/socialLinkHelpers';
import env from '../env';
import { firstDefined } from '../helpers';
import { downloadMediaFromBrand } from './brandfetch';
import type { ApiResolver } from '../types';
import type { PersonResponse } from 'peopledatalabs';

const PDLJSClient = new PDLJS({
  apiKey: env.PEOPLEDATALABS_KEY,
});

export const peopleDataLabsEnrichment: ApiResolver = {
  name: 'peopledatalabs',
  priority: 2,
  provides: {
    contact: [
      'emails',
      'firstName',
      'lastName',
      'phoneNumbers',
      'company',
      'title',
      'socials',
    ],
    profile: [
      'headline',
      'summary',
      'interests',
      'skills',
      'positions',
      'education',
      'country',
    ],
  },
  dependsOn: { any: ['contact.emails', 'contact.phoneNumbers'] },
  run: async data => {
    const values = [
      ...(data.contact.emails?.map(email => ({ email: email.address })) ?? []),
      ...(data.contact.phoneNumbers?.map(phone => ({ phone: phone.number })) ??
        []),
    ];
    return firstDefined(values, async value => {
      const response = await PDLJSClient.person.enrichment(value);

      if (response.status === 200) {
        const { data } = response;
        const mediaPromises = Array<Promise<string>>();
        return {
          data: await buildContact(data, mediaPromises),
          mediaPromises,
        };
      }
      return null;
    });
  },
};

const buildContact = async (
  data: PersonResponse,
  mediaPromises: Array<Promise<string>>,
) => {
  const uniqueBrands = (
    data.experience?.map(position => ({
      brand: position.company?.name,
      website: position.company?.website,
    })) ?? []
  )
    .concat(
      data.education?.map(education => ({
        brand: education.school?.name,
        website: education.school?.website,
      })) ?? [],
    )
    .reduce(
      (acc, { brand, website }) => {
        if (brand && !acc.some(b => b.brand === brand)) {
          acc.push({ brand, website });
        }
        return acc;
      },
      [] as Array<{ brand: string; website?: string | null }>,
    );
  const logoIdPerBrand = new Map<string, string>();
  uniqueBrands.forEach(({ brand, website }) => {
    if (brand && website) {
      const logo = downloadMediaFromBrand(website);
      if (logo) {
        logoIdPerBrand.set(brand, logo.mediaId);
        mediaPromises.push(logo.promise);
      }
      return {
        brand,
        logoId: logo,
      };
    }
  });

  return {
    contact: {
      emails: (Array.isArray(data.emails)
        ? data.emails
            .map(email =>
              email.address
                ? {
                    address: email.address,
                    label:
                      email.type === 'current_professional' ||
                      email.type === 'professional'
                        ? 'Work'
                        : 'Home',
                  }
                : null,
            )
            .filter(data => data !== null)
        : []
      ).concat(
        Array.isArray(data.personal_emails)
          ? data.personal_emails.map(email => ({
              address: email,
              label: 'Home',
            }))
          : [],
      ),
      firstName: data.first_name,
      lastName: data.last_name,
      phoneNumbers: (Array.isArray(data.phone_numbers)
        ? data.phone_numbers.map(phone => ({
            number: phone,
            label: 'Home',
          }))
        : []
      )
        .concat(
          Array.isArray(data.phones)
            ? data.phones
                .map(phone =>
                  phone.number
                    ? {
                        number: phone.number,
                        label: 'Home',
                      }
                    : null,
                )
                .filter(data => data !== null)
            : [],
        )
        .concat(
          data.mobile_phone && typeof data.mobile_phone === 'string'
            ? [
                {
                  number: data.mobile_phone,
                  label: 'Home',
                },
              ]
            : [],
        ),
      company: data.job_company_name,
      title: data.job_title,
      socials: data.profiles
        ? data.profiles
            .map(profile =>
              profile.url && profile.network && isSocialLinkId(profile.network)
                ? {
                    label: profile.network,
                    url: profile.url,
                  }
                : null,
            )
            .filter(data => data !== null)
        : [],
    },
    profile: {
      headline: data.headline,
      summary: data.summary,
      interests: data.interests,
      skills: data.skills,
      positions: data.experience
        ? await Promise.all(
            data.experience?.map(async position => ({
              company: position.company?.name,
              title: position.title?.name,
              summary: position.summary,
              startDate: position.start_date,
              endDate: position.end_date,
              tempLogoId: position.company?.name
                ? logoIdPerBrand.get(position.company.name)
                : null,
            })),
          )
        : undefined,

      education: data.education
        ? await Promise.all(
            data.education?.map(async education => ({
              school: education.school?.name,
              startDate: education.start_date,
              endDate: education.end_date,
              summary: education.summary,
              tempLogoId: education.school?.name
                ? logoIdPerBrand.get(education.school?.name)
                : null,
            })),
          )
        : undefined,
      country: data.location_country,
      city:
        typeof data.location_locality === 'string'
          ? data.location_locality
          : undefined,
    },
  };
};

export const peopleDataLabsIdentify: ApiResolver = {
  name: 'peopledatalabs',
  priority: 3,
  provides: {
    contact: [
      'emails',
      'firstName',
      'lastName',
      'phoneNumbers',
      'company',
      'title',
      'socials',
    ],
    profile: [
      'headline',
      'summary',
      'interests',
      'skills',
      'positions',
      'education',
      'country',
    ],
  },
  dependsOn: {
    all: [
      'contact.firstName',
      'contact.lastName',
      { any: ['contact.company', 'profile.country'] },
    ],
  },
  run: async data => {
    const response = await PDLJSClient.person.identify({
      first_name: data.contact.firstName!,
      last_name: data.contact.lastName!,
      company: data.contact.company || undefined,
      country: data.profile?.country || undefined,
      email: data.contact.emails?.[0]?.address || undefined,
      phone: data.contact.phoneNumbers?.[0]?.number || undefined,
      school: data.profile?.education?.[0]?.school || undefined,
      locality: data.profile?.city || undefined,
    });

    if (response.status === 200) {
      const data = response.matches[0].data;
      const mediaPromises: Array<Promise<string>> = [];
      return {
        data: await buildContact(data, mediaPromises),
        mediaPromises,
      };
    } else {
      return {
        error: {
          httpStatusCode: response.status,
          message: `The enrichment failed with status ${response.status} - rate limit: ${response.rateLimit}`,
        },
      };
    }
  },
};
