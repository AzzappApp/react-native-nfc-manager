import env from '#env';
import client from './client';

const name = env.PAYMENT_API_NAME;
const password = env.PAYMENT_API_PASSWORD;

export const login = async () => {
  const resultToken = await client.POST('/api/login_check', {
    body: {
      name,
      password,
    },
  });

  if (!resultToken.data) {
    throw resultToken.error;
  }

  return resultToken.data.token;
};
