export const getApiEndpoint = (request: Request) => {
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost';

  const apiEndpoint = `${protocol}://${host}`;

  console.log(
    'getApiEndpoint',
    request.headers.get('x-forwarded-proto'),
    request.headers.get('host'),
    apiEndpoint,
  );

  return apiEndpoint;
};
