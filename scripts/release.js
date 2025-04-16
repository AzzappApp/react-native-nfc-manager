const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Octokit: GitHubAPI } = require('@octokit/rest');
const buildChangeLog = require('./buildChangeLog');
const setWorkspaceVersions = require('./setWorkspaceVersions');

const main = async () => {
  console.error('This script is not up to date with new versioning system');
  process.exit(1);
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
  const [major, minor, patch] = nextVersion.split('-')[0].split('.');
  const paddedMinor = minor.padStart(2, '0');
  const paddedPatch = patch.padStart(2, '0');
  const androidVersionCode = `${major}${paddedMinor}${paddedPatch}000`;

  console.log('Updating worskpace version...');
  setWorkspaceVersions(nextVersion, androidVersionCode);

  console.log('Erase changelog');
  fs.writeFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), '');

  console.log('Commiting changes...');
  execSyncWithLog(`git add .`);
  execSyncWithLog(`git commit -m "chore: release ${nextVersion}"`);

  console.log('Pushing changes...');
  execSyncWithLog(`git push origin`);

  console.log('Tagging version...');
  const tagName = `v${nextVersion}`;
  execSyncWithLog(`git tag ${tagName}`);

  console.log('Pushing tag...');
  execSyncWithLog(`git push origin ${tagName}`);

  console.log('Creating github release...');

  const release = await github.repos.createRelease({
    repo: 'azzapp',
    owner: 'AzzappApp',
    tag_name: tagName,
    name: tagName,
    body: changeLog,
    prerelease,
  });

  const baseBranch = prerelease ? 'main' : 'staging';
  const targetBranch = prerelease ? 'staging' : 'stable';

  console.log(`Merge to target branch : ${targetBranch}...`);

  await github.repos.merge({
    repo: 'azzapp',
    owner: 'AzzappApp',
    base: targetBranch,
    head: baseBranch,
    commit_message: `Merge ${baseBranch} to ${targetBranch}`,
  });

  console.log(`Done! ${release.data.html_url}`);
  process.exit(0);
};

main();

const execSyncWithLog = (command, options) => {
  try {
    console.log('executing command', command);
    const res = execSync(command, options);
    console.log(res.toString());
  } catch (err) {
    console.log(`Error executing ${command}: `, err);
    console.log('stdout', err.stdout.toString());
    console.log('sdterr', err.stderr.toString());
    throw err;
  }
};
