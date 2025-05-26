import * as Sentry from '@sentry/nextjs';
import { isDefined } from '@azzapp/shared/isDefined';
import env from '../env';
import { uploadMediaFromUrl } from '../media';
import type { ApiResolver, EnrichedData } from '../types';

export const proxyCurlLookup: ApiResolver = {
  name: 'proxycurl',
  priority: 1,
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
  dependsOn: { all: ['contact.firstName', 'contact.company'] },
  run: async data => {
    const url = new URL(
      'https://nubela.co/proxycurl/api/linkedin/profile/resolve',
    );

    url.searchParams.append('first_name', data.contact.firstName!);
    url.searchParams.append('company_domain', data.contact.company!);
    if (data.contact.lastName) {
      url.searchParams.append('last_name', data.contact.lastName);
    }
    url.searchParams.append('skills', 'include');
    url.searchParams.append('enrich_profile', 'enrich');
    if (data.profile?.country) {
      url.searchParams.append('location', data.profile.country);
    }
    url.searchParams.append('personal_contact_number', 'include');
    url.searchParams.append('personal_email', 'include');
    url.searchParams.append('github_profile_id', 'include');
    url.searchParams.append('facebook_profile_id', 'include');
    url.searchParams.append('twitter_profile_id', 'include');
    url.searchParams.append('skills', 'skip');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${env.PROXY_CURL_KEY}` },
    });

    if (response.ok) {
      const json: ProfileLookupEnrichedResponse = await response.json();
      const mediaPromises: Array<Promise<string>> = [];
      return {
        data: await buildDataFromResponse(
          json.profile,
          mediaPromises,
          json.url,
        ),
        mediaPromises,
      };
    } else {
      return {
        error: {
          httpStatusCode: response.status,
          message: response.statusText,
        },
      };
    }
  },
};

const buildDataFromResponse = async (
  profile: PersonProfileResponse,
  mediaPromises: Array<Promise<string>>,
  linkedinProfileUrl?: string | null,
) => {
  const logos = new Set(
    (profile.experiences?.map(exp => exp.logo_url) ?? [])
      .concat(profile?.education?.map(edu => edu.logo_url) ?? [])
      .filter(isDefined),
  );

  const logoIdPerUrl = new Map<string, string>();
  logos.forEach(url => {
    const res = uploadMediaFromUrl(url);

    logoIdPerUrl.set(url, res.id);
    mediaPromises.push(res.promise);
  });

  const avatar = profile?.profile_pic_url
    ? uploadMediaFromUrl(profile.profile_pic_url)
    : null;
  let avatarId;
  if (avatar) {
    try {
      avatarId = await avatar.promise;
    } catch (e) {
      Sentry.captureException(e, {
        extra: {
          profilePicUrl: profile.profile_pic_url,
        },
      });
      avatarId = undefined;
    }
  }

  return {
    contact: {
      avatarId,
      firstName: profile.first_name,
      lastName: profile.last_name,
      company: profile.occupation,
      title: profile.headline,
      birthday: profile.birth_date,
      emails: profile.personal_emails?.map(email => ({
        address: email,
        label: 'Home',
      })),
      phoneNumbers: profile.personal_numbers?.map(phone => ({
        number: phone,
        label: 'Home',
      })),
      socials: [
        ...(linkedinProfileUrl
          ? [
              {
                label: 'linkedin',
                url: linkedinProfileUrl,
              } as const,
            ]
          : []),
        ...(profile.extra?.twitter_profile_id
          ? [
              {
                label: 'twitter',
                url: `https://x.com/${profile.extra.twitter_profile_id}`,
              } as const,
            ]
          : []),
        ...(profile.extra?.facebook_profile_id
          ? [
              {
                label: 'facebook',
                url: `https://facebook.com/${profile.extra.facebook_profile_id}`,
              } as const,
            ]
          : []),
        ...(profile.extra?.github_profile_id
          ? [
              {
                label: 'github',
                url: `https://github.com/${profile.extra.github_profile_id}`,
              } as const,
            ]
          : []),
      ],
    },
    profile: {
      firstName: profile.first_name,
      lastName: profile.last_name,
      title: profile.headline,
      company: profile.occupation,
      country: profile.country_full_name,
      city: profile.city,
      skills: profile.skills,
      positions: await Promise.all(
        (profile.experiences ?? [])?.map(async exp => ({
          company: exp.company,
          title: exp.title,
          summary: exp.description,
          startDate:
            exp.starts_at?.year && exp.starts_at?.month
              ? new Date(
                  exp.starts_at?.year,
                  exp.starts_at?.month,
                  exp.starts_at?.day,
                ).toISOString()
              : undefined,
          endDate:
            exp.ends_at?.year && exp.ends_at?.month
              ? new Date(
                  exp.ends_at?.year,
                  exp.ends_at?.month,
                  exp.ends_at?.day,
                ).toISOString()
              : undefined,
          tempLogoId: exp.logo_url ? logoIdPerUrl.get(exp.logo_url) : undefined,
        })),
      ),
      education: await Promise.all(
        (profile.education ?? [])?.map(async edu => ({
          school: edu.school,
          tempLogoId: edu.logo_url ? logoIdPerUrl.get(edu.logo_url) : undefined,
          startDate:
            edu.starts_at?.year && edu.starts_at?.month
              ? new Date(
                  edu.starts_at?.year,
                  edu.starts_at?.month,
                  edu.starts_at?.day,
                ).toISOString()
              : undefined,
          summary: edu.description,
          endDate:
            edu.ends_at?.year && edu.ends_at?.month
              ? new Date(
                  edu.ends_at?.year,
                  edu.ends_at?.month,
                  edu.ends_at?.day,
                ).toISOString()
              : undefined,
        })),
      ),
    },
  };
};

export const proxyCurlProfile: ApiResolver = {
  name: 'proxycurl',
  priority: 1,
  provides: {
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
      'contact.socials',
      (data: EnrichedData) =>
        data.contact?.socials?.some(social => social.label === 'linkedin') ??
        false,
    ],
  },
  run: async data => {
    const url = new URL('https://nubela.co/proxycurl/api/linkedin/profile');

    const linkedinUrl = data.contact?.socials?.find(
      social => social.label === 'linkedin',
    )?.url;

    if (!linkedinUrl) {
      return {
        error: {
          message: 'No LinkedIn URL found',
        },
      };
    }

    url.searchParams.append('url', linkedinUrl);
    url.searchParams.append('enrich_profile', 'enrich');
    url.searchParams.append('skills', 'enrich');
    url.searchParams.append('personal_contact_number', 'include');
    url.searchParams.append('personal_email', 'include');
    url.searchParams.append('github_profile_id', 'include');
    url.searchParams.append('facebook_profile_id', 'include');
    url.searchParams.append('twitter_profile_id', 'include');
    url.searchParams.append('use_cache', 'if-present');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${env.PROXY_CURL_KEY}` },
    });

    if (response.ok) {
      const json: PersonProfileResponse = await response.json();
      const mediaPromises: Array<Promise<string>> = [];
      return {
        data: json ? await buildDataFromResponse(json, mediaPromises) : {},
        mediaPromises,
      };
    } else {
      return {
        error: {
          httpStatusCode: response.status,
          message: response.statusText,
        },
      };
    }
  },
};

export const proxyCurlPicture: ApiResolver = {
  priority: 3,
  name: 'proxycurlPicture',
  provides: {
    contact: ['avatarId'],
  },
  dependsOn: (data: EnrichedData) =>
    data.contact?.socials?.some(social => social.label === 'linkedin') ?? false,
  run: async data => {
    const linkedinUrl = data.contact?.socials?.find(
      social => social.label === 'linkedin',
    )?.url;

    if (!linkedinUrl) {
      return {
        error: { message: 'No LinkedIn URL found' },
      };
    }

    const url = new URL(
      'https://nubela.co/proxycurl/api/linkedin/person/profile-picture',
    );

    url.searchParams.append('linkedin_person_profile_url', linkedinUrl);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${env.PROXY_CURL_KEY}` },
    });

    if (response.ok) {
      const json: {
        tmp_profile_pic_url: string;
      } = await response.json();

      const avatar = json?.tmp_profile_pic_url
        ? uploadMediaFromUrl(json.tmp_profile_pic_url)
        : null;
      let avatarId;
      if (avatar) {
        try {
          avatarId = await avatar.promise;
        } catch (e) {
          Sentry.captureException(e, {
            extra: {
              profilePicUrl: json.tmp_profile_pic_url,
            },
          });
          avatarId = undefined;
        }
      }

      return {
        data: {
          contact: {
            avatarId,
          },
        },
      };
    } else {
      return {
        error: {
          httpStatusCode: response.status,
          message: response.statusText,
        },
      };
    }
  },
};

type ProfileLookupEnrichedResponse = {
  /** The LinkedIn profile URL if found, or null if not found */
  url: string | null;

  /** Enriched profile data */
  profile: PersonProfileResponse;
};

type PersonProfileResponse = {
  public_identifier: string;
  profile_pic_url?: string;
  background_cover_image_url?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  occupation?: string;
  headline?: string;
  summary?: string;
  country?: string;
  country_full_name?: string;
  city?: string;
  state?: string;
  experiences?: Experience[];
  education?: Education[];
  languages?: string[];
  accomplishment_organisations?: Accomplishment[];
  accomplishment_publications?: Accomplishment[];
  accomplishment_honors_awards?: Accomplishment[];
  accomplishment_patents?: Accomplishment[];
  accomplishment_courses?: Accomplishment[];
  accomplishment_projects?: Accomplishment[];
  accomplishment_test_scores?: Accomplishment[];
  volunteer_work?: Experience[];
  certifications?: Certification[];
  connections?: number;
  people_also_viewed?: string[];
  recommendations?: Recommendation[];
  activities?: Activity[];
  similarly_named_profiles?: string[];
  articles?: Article[];
  groups?: string[];
  skills?: string[];
  inferred_salary?: string;
  gender?: string;
  birth_date?: string;
  industry?: string;
  interests?: string[];
  extra?: {
    twitter_profile_id?: string;
    facebook_profile_id?: string;
    github_profile_id?: string;
    website?: string;
  };
  personal_emails?: string[];
  personal_numbers?: string[];
};

type Experience = {
  title?: string;
  company?: string;
  company_linkedin_profile_url?: string;
  location?: string;
  starts_at?: DateObject;
  ends_at?: DateObject | null;
  description?: string;
  logo_url?: string;
};

type Education = {
  school?: string;
  degree?: string;
  field_of_study?: string;
  starts_at?: DateObject;
  ends_at?: DateObject | null;
  grade?: string;
  activities_and_societies?: string;
  description?: string;
  logo_url?: string;
};

type DateObject = {
  day?: number;
  month?: number;
  year?: number;
};

type Accomplishment = {
  name?: string;
  description?: string;
  link?: string;
  logo_url?: string;
  starts_at?: DateObject;
  ends_at?: DateObject | null;
};

type Certification = {
  name?: string;
  issuing_organization?: string;
  issue_date?: DateObject;
  expiration_date?: DateObject | null;
  credential_id?: string;
  credential_url?: string;
};

type Recommendation = {
  recommender?: string;
  recommendation_text?: string;
};

type Activity = {
  activity_title?: string;
  activity_url?: string;
  activity_date?: DateObject;
};

type Article = {
  title?: string;
  url?: string;
  published_date?: DateObject;
};
