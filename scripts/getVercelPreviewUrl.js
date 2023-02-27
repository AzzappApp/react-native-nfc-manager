const fetch = require('node-fetch');
const [, , GITHUB_REF, GITHUB_SHA, VERCEL_TOKEN] = process.argv;

const DEV = 'azzapp-dev.vercel.app';
const STAGING = 'azzapp-staging.vercel.app';
const PRODUCTION = 'azzapp.vercel.app';

const TIMEOUT = 300;
const VERCEL_TEAM_ID = 'azzapp';
const VERCEL_PROJECT_NAME = 'azzapp';

console.log(
  `Searching vercel deployment for ref: ${GITHUB_REF} sha: ${GITHUB_SHA}`,
);

const setOutPut = value =>
  console.log(`::set-output name=vercel_url::${value}`);

if (GITHUB_REF === 'refs/heads/main') {
  setOutPut(DEV);
  process.exit(0);
}
if (GITHUB_REF === 'refs/heads/staging') {
  setOutPut(STAGING);
  process.exit(0);
}

if (GITHUB_REF === 'refs/heads/stable') {
  setOutPut(PRODUCTION);
  process.exit(0);
}

const fetchVercelUrl = async () => {
  const start = Date.now();
  while ((Date.now() - start) / 1000 < TIMEOUT) {
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?projectName=${VERCEL_PROJECT_NAME}&teamId=${VERCEL_TEAM_ID}`,
      {
        headers: {
          Accept: 'application/json ',
          Authorization: `Bearer ${VERCEL_TOKEN}`,
        },
      },
    );

    if (response.ok) {
      const { deployments } = await response.json();

      const deployment = deployments.find(
        ({ meta }) => meta.githubCommitSha === GITHUB_SHA,
      );
      if (deployment) {
        return deployment.url;
      }
    }
  }
  throw new Error('Could not find deployment URL');
};

fetchVercelUrl().then(
  url => {
    setOutPut(url);
    process.exit(0);
  },
  e => {
    console.error(e.message);
    process.exit(1);
  },
);
