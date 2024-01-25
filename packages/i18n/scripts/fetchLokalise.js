const LOKALISE_ENDPOINT = 'https://api.lokalise.com/api2';
const APP_PROJECT_ID = process.env.LOKALISE_PROJECT_ID;
const TOKEN = process.env.LOKALISE_TOKEN;

const createFetchLokalise = environment => {
  if (!['staging', 'stable'].includes(environment)) {
    throw new Error('Invalid environment');
  }
  if (!APP_PROJECT_ID) {
    throw new Error('Missing LOKALISE_PROJECT_ID');
  }
  if (!TOKEN) {
    throw new Error('Missing LOKALISE_TOKEN');
  }
  const BRANCH = environment === 'staging' ? 'staging' : 'master';
  const BASE_URL = `${LOKALISE_ENDPOINT}/projects/${APP_PROJECT_ID}:${BRANCH}`;

  const fetchLokalise = (endpoint, init) =>
    fetch(`${BASE_URL}${endpoint}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Token': TOKEN,
      },
    }).then(resp => resp.json());

  return fetchLokalise;
};

exports.createFetchLokalise = createFetchLokalise;
