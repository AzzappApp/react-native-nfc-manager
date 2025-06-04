import { isDefined } from '@azzapp/shared/isDefined';
import env from '../env';
import { firstDefined } from '../helpers';
import type { ApiResolver } from '../types';

export const ipqualityscore: ApiResolver = {
  name: 'ipqualityscore',
  priority: 3,
  provides: {
    contact: ['firstName', 'lastName'],
  },
  dependsOn: 'contact.phoneNumbers',
  run: async data => {
    return firstDefined(
      data.contact.phoneNumbers
        ?.map(phoneNumber => phoneNumber.number)
        .filter(isDefined) ?? [],
      async phoneNumber => {
        const url = `https://www.ipqualityscore.com/api/json/phone/${env.IPQUALITYSCORE_KEY}/${encodeURIComponent(phoneNumber)}`;

        const response = await fetch(url);

        if (response.ok) {
          const result = await response.json();
          if (
            result.name &&
            result.name !== '' &&
            result.name !== 'null' &&
            result.name !== 'undefined' &&
            result.name !== 'N/A'
          ) {
            const [firstName, ...lastNameParts] = result.name.split(' ');

            const lastName = lastNameParts.join(' ');

            return {
              data: {
                contact: {
                  firstName: firstName || undefined,
                  lastName: lastName || undefined,
                },
              },
            };
          } else {
            return null;
          }
        } else {
          return {
            error: {
              message: response.statusText,
              status: response.status,
            },
          };
        }
      },
    );
  },
};
