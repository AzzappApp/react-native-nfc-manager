import client from '#client';

const name = process.env.PAYMENT_API_NAME ?? '';
const password = process.env.PAYMENT_API_PASSWORD ?? '';

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
