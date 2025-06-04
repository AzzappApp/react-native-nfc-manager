import {
  getUserNameFromUrl,
  type SocialLinkId,
} from '@azzapp/shared/socialLinkHelpers';
import { firstDefined } from '../helpers';
import { uploadMedia } from '../media';
import type { ApiResolver } from '../types';

const unAvatarSocials: SocialLinkId[] = [
  'github',
  'dribbble',
  'telegram',
  'twitter',
  'youtube',
  'twitch',
  'soundcloud',
];

export const unAvatar: ApiResolver = {
  name: 'unavatar',
  priority: 1,
  provides: {
    contact: ['avatarId'],
  },
  dependsOn: {
    all: [
      'contact.socials',
      ({ contact }) =>
        contact.socials?.some(social =>
          unAvatarSocials.includes(social.label),
        ) ?? false,
    ],
  },
  run: async data => {
    return firstDefined(
      data.contact.socials!.filter(social =>
        unAvatarSocials.includes(social.label),
      ),
      async social => {
        const userName = getUserNameFromUrl(social.url);

        if (userName) {
          const avatarUrl = `https://unavatar.io/${social.label}/${userName}?fallback=false`;

          const avatar = await fetch(avatarUrl);

          if (avatar.ok) {
            const avatarId = await uploadMedia(await avatar.blob());

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
                message: avatar.statusText,
                status: avatar.status,
              },
            };
          }
        } else {
          return null;
        }
      },
    );
  },
};
