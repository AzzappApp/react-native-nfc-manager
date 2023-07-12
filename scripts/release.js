const { execSync } = require('child_process');
const { Octokit: GitHubAPI } = require('@octokit/rest');
const buildChangeLog = require('./buildChangeLog');
const setWorkspaceVersions = require('./setWorkspaceVersions');

const main = async () => {
  const args = process.argv.slice(2);
  if (args.length > 2) {
    console.error('Too many arguments');
    process.exit(1);
  }
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error('GITHUB_TOKEN is not set');
    process.exit(1);
  }

  const github = new GitHubAPI({
    auth: githubToken,
  });

  let prerelease = false;
  let majorInc = false;

  args.forEach(arg => {
    if (arg === '--prerelease') {
      prerelease = true;
    } else if (arg === '--major') {
      majorInc = true;
    } else {
      console.error(`Invalid argument ${arg}`);
      process.exit(1);
    }
  });

  const { nextVersion, changeLog } = await buildChangeLog(prerelease, majorInc);

  console.log('Updating worskpace version...');
  setWorkspaceVersions(nextVersion);

  console.log('Commiting changes...');
  execSync(`git add .`);
  execSync(`git commit -m "chore: release ${nextVersion}"`);

  console.log('Pushing changes...');
  execSync(`git push origin`);

  console.log('Tagging version...');
  const tagName = `v${nextVersion}`;
  execSync(`git tag ${tagName}`);

  console.log('Pushing tag...');
  execSync(`git push origin ${tagName}`);

  console.log('Creating github release...');

  const release = await github.repos.createRelease({
    repo: 'azzapp',
    owner: 'AzzappApp',
    tag_name: tagName,
    name: tagName,
    body: changeLog,
    prerelease,
  });

  console.log(`Done! ${release.data.html_url}`);
  process.exit(0);
};

main();
