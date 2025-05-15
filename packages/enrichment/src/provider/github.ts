import { uploadMedia } from '../media';
import type { ApiResolver } from '../types';

export const githubAvatar: ApiResolver = {
  name: 'github',
  priority: 2,
  provides: {
    contact: ['avatarId'],
  },
  dependsOn: ({ contact }) => {
    return contact.socials?.some(social => social.label === 'github') ?? false;
  },
  run: async data => {
    const githubUrl = data.contact.socials?.find(
      social => social.label === 'github',
    )?.url;
    if (!githubUrl) {
      return {
        error: { message: 'No github url found' },
      };
    }

    const githubAvatar = githubUrl.startsWith('https')
      ? `${githubUrl}.png`
      : `https://${githubUrl}.png`;

    const avatar = await fetch(githubAvatar, {
      redirect: 'follow',
    });
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
  },
};
