const token = process.env.VERCEL_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID;
const teamId = process.env.VERCEL_TEAM_ID;
const gitBranch = process.env.GITHUB_REF_NAME;
const isProd = gitBranch === 'stable';
const target = isProd ? 'production' : 'preview';

const params = new URLSearchParams({
  projectId,
  teamId,
  target,
  state: 'READY',
  'meta-githubCommitRef': gitBranch,
  limit: '1',
});

const url = `https://api.vercel.com/v6/deployments?${params.toString()}`;

(async () => {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(
        `Vercel API request failed: ${response.status} ${response.statusText}`,
      );
      process.exit(1);
    }

    const data = await response.json();
    const sha = data.deployments?.[0]?.meta?.githubCommitSha;

    if (sha) {
      process.stdout.write(sha);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error while fetching from Vercel API:', err);
    process.exit(1);
  }
})();
