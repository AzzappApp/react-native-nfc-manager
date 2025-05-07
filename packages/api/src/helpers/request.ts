export const getApiEndpoint = (request: Request) => {
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost';

  const apiEndpoint = `${protocol}://${host}`;

  return apiEndpoint;
};
