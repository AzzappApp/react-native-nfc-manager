import { extractSingleJsonObject } from '../helpers';
import type { ApiResolver, EnrichedData } from '../types';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;
const endpoint = 'https://api.perplexity.ai/chat/completions';

export const perplexity: ApiResolver = {
  name: 'perplexity',
  priority: 4,
  provides: {
    contact: ['firstName', 'lastName', 'company', 'title', 'socials'],
    profile: ['headline', 'summary', 'interests', 'skills', 'country'],
  },
  dependsOn: {
    any: [
      { all: ['contact.firstName', 'contact.company'] },
      { all: ['contact.lastName', 'contact.company'] },
      { all: ['contact.firstName', 'contact.lastName'] },
      { all: ['contact.firstName', 'contact.birthday'] },
      { all: ['contact.lastName', 'contact.birthday'] },
      { all: ['contact.firstName', 'contact.addresses'] },
      { all: ['contact.lastName', 'contact.addresses'] },
    ],
  },
  run: async data => {
    const profile = `{ ${!data.profile?.headline ? 'headline?: string|null;' : ''}${
      !data.profile?.summary ? 'summary?: string|null; ' : ''
    }${!data.profile?.interests ? 'interests?: string[]|null; ' : ''}${
      !data.profile?.skills ? 'skills?: string[]|null; ' : ''
    }${!data.profile?.country ? 'country?: string|null; ' : ''}${!data.profile?.city ? 'city?: string|null; ' : ''}
    ${
      !data.profile?.skills || !data.profile?.interests
        ? 'icons: Record<string,string>'
        : ''
    } }`;

    const contact = `{ ${!data.contact?.firstName ? 'firstName?: string|null;' : ''}${
      !data.contact?.lastName ? 'lastName?: string|null; ' : ''
    }${!data.contact?.company ? 'company?: string|null; ' : ''}${
      !data.contact?.title ? 'title?: string|null; ' : ''
    }${!data.contact?.birthday ? 'birthday?: string|null (format yyyy-MM-dd); ' : ''}${
      !data.contact?.addresses ? 'addresses?: string[]|null; ' : ''
    }socials: {label, url}[]; urls: {url: string}[]; }`;

    const prompt = `You will receive a JSON object representing a contact. Use reliable public sources to enrich this contact with public data **only if the identity is clear and unambiguous**.

If the information matches a known public profile, only return a JSON with two keys:
1. "profile": includes { ${profile} }
2. "contact": includes { ${contact} }

Don’t include fields where the value is null or empty.
Only include websites in urls (no social media).
For socials, use the lowercase name of the social platform as the label.
For icons, I would like a json to map interests and skills (as key) and the svg name of existing related remix icon as value, when one match..

⚠️ If there is any ambiguity, or if you're not confident about the match, return exactly:
{ "profile": null, "contact": null }

Here is the contact:
${JSON.stringify(
  {
    firstName: data.contact.firstName,
    lastName: data.contact.lastName,
    company: data.contact.company,
    title: data.contact.title,
    birthday: data.contact.birthday,
    addresses: data.contact.addresses,
    socials: data.contact.socials,
  },
  null,
  2,
)}`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    };

    const body = {
      model: 'sonar-deep-research',
      messages: [
        {
          role: 'system',
          content: 'Return *only* raw JSON, without backticks or comments..',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();

      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        return {
          error: {
            message: 'No content in response',
            status: res.status,
          },
        };
      }

      const parsed = extractSingleJsonObject<EnrichedData>(text);
      return {
        data: {
          profile: parsed?.profile || {},
          contact: parsed?.contact || {},
        },
      };
    } else {
      return {
        error: {
          message: res.statusText,
          status: res.status,
        },
      };
    }
  },
};

export const perplexityIcons: ApiResolver = {
  name: 'perplexityIcons',
  priority: 4,
  provides: {
    profile: ['icons'],
  },
  dependsOn: {
    any: [{ any: ['profile.skills', 'profile.interests'] }],
  },
  run: async data => {
    const prompt = `You will receive a list of skills and interests. Return a json to map interests and skills (as key) and the svg name of existing related remix icon as value, when one match.

Here are the skills and interests:
${(data.profile?.skills ?? []).concat(data.profile?.interests || []).join(', ')}`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    };

    const body = {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'Return *only* raw JSON, without backticks or comments..',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();

      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        return {
          error: {
            message: 'No content in response',
            status: res.status,
          },
        };
      }

      const icons = extractSingleJsonObject<Record<string, string>>(text);
      return {
        data: {
          profile: {
            icons,
          },
        },
      };
    } else {
      return {
        error: {
          message: res.statusText,
          status: res.status,
        },
      };
    }
  },
};
