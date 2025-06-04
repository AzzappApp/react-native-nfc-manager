const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Octokit: GitHubAPI } = require('@octokit/rest');
const internal = require('../internal-version.json');
const pkg = require('../package.json');
const buildChangeLog = require('./buildChangeLog');
const setWorkspaceVersions = require('./setWorkspaceVersions');

const extractVersionNumber = version => {
  const [major, minor, patch] = version.split('-')[0].split('.');
  return [Number(major), Number(minor), Number(patch)];
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args.length > 1) {
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
  if (args[0] === '--prerelease') {
    prerelease = true;
  } else if (args[0]) {
    console.error(
      `Invalid argument ${args[0]}. Use --prerelease to create a prerelease.`,
    );
    process.exit(1);
  }

  if (prerelease && internal.kind !== 'canary') {
    console.error(
      `You can only create a prerelease from main to staging (canary to rc). Current internal version kind is '${internal.kind}'.`,
    );
    process.exit(1);
  } else if (!prerelease && internal.kind !== 'rc') {
    console.error(
      `You can only create a release from staging to stable (rc to release). Current internal version kind is '${internal.kind}'.`,
    );
    process.exit(1);
  }

  const [major, minor, patch] = extractVersionNumber(pkg.version);

  let nextVersion = `${major}.${minor}.${patch}`;
  if (prerelease) {
    nextVersion += `-rc.1`;
  }

  const changeLog = await buildChangeLog(nextVersion, prerelease);

  console.log('Updating workspace version...');
  setWorkspaceVersions(prerelease ? 'rc' : 'release', major, minor, patch, 1);

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
