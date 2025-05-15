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

        return {
          data: await buildContact(data),
        };
      }
      return null;
    });
  },
};

const buildContact = async (data: PersonResponse) => {
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

  const logos = await Promise.all(
    uniqueBrands.map(async ({ brand, website }) => {
      if (brand) {
        const logo = await downloadMediaFromBrand(brand, website);
        return {
          brand,
          logoId: logo,
        };
      }
    }),
  );

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
              logoId: position.company?.name
                ? logos.find(logo => logo?.brand === position.company?.name)
                    ?.logoId
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
              logoId: education.school?.name
                ? logos.find(logo => logo?.brand === education.school?.name)
                    ?.logoId
                : null,
            })),
          )
        : undefined,
      country: data.countries?.length ? data.countries[0] : undefined,
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
      locality: data.profile?.country || undefined,
    });

    if (response.status === 200) {
      const data = response.matches[0].data;
      return {
        data: await buildContact(data),
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
