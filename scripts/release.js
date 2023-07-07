const { execSync } = require('child_process');
const path = require('path');
const { Octokit: GitHubAPI } = require('@octokit/rest');
const gitStream = require('git-spawned-stream');

const semVer = require('semver');
const taggedVersions = require('tagged-versions');

const loadCommits = rev => {
  const repoPath = path.join(process.cwd(), '.git');
  const inner = Date.now();
  const outer = inner - 1;

  // How the output shoud look like
  const spec = ['s', 'n', 'ae', 'b'];
  const format = `${inner}%${spec.join(`${inner}%`)}${outer}`;

  return new Promise(resolve => {
    const stream = gitStream(repoPath, [
      'rev-list',
      `--pretty=format:${format}`,
      '--header',
      rev || 'HEAD',
    ]);

    let commits = [];

    stream.on('data', data => {
      const parts = data
        .toString('utf8')
        .split(outer)
        .map(item => {
          const trimmed = item.trim();

          if (trimmed.length === 0) {
            return null;
          }

          const splitted = trimmed.split(inner);
          const details = splitted.map(i => i.trim()).filter(i => i);

          return {
            hash: details[0].split(' ')[1],
            title: details[1] || '',
            description: details[3] || '',
            author: details[2],
          };
        })
        .filter(i => i);

      commits = commits.concat(parts);
    });

    stream.on('error', () => {
      console.error('Failed to load commits');
      process.exit(1);
    });

    stream.on('end', () => resolve(commits));
  });
};

const formatCommit = ({ scope, message }) => {
  return `* ${scope ? `**${scope}:** ` : ''}${message}`;
};

const BREAKING_CHANGE_PATTERN = /BREAKING CHANGE/g;

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

  const currentVersion = require('../package.json').version;
  console.log('Checking previous versions...');
  const tags = (await taggedVersions.getList())
    .filter(
      tag =>
        (prerelease || !semVer.prerelease(tag.version)) &&
        semVer.lt(tag.version, currentVersion),
    )
    .sort((a, b) => semVer.rcompare(a.version, b.version));

  const lastTag = tags?.[0];

  console.log('Retriving commits...');
  const commits = await loadCommits(lastTag ? `${lastTag.hash}..HEAD` : null);

  console.log('Determining version and building change log...');
  const increment = majorInc
    ? 'major'
    : commits.some(c =>
        BREAKING_CHANGE_PATTERN.test(c.title) ||
        BREAKING_CHANGE_PATTERN.test(c.description)
          ? 'minor'
          : 'patch',
      );

  const lastReleasedVersion = lastTag ? lastTag.version : currentVersion;
  const [major, minor, patch] = lastReleasedVersion.split('-')[0].split('.');

  let nextVersion = '';
  switch (increment) {
    case 'major':
      nextVersion = `${Number(major) + 1}.0.0`;
      break;
    case 'minor':
      nextVersion = `${major}.${Number(minor) + 1}.0`;
      break;
    default:
      nextVersion = `${major}.${minor}.${Number(patch) + 1}`;
      break;
  }
  if (prerelease) {
    nextVersion = `${nextVersion}-rc.0`;
  }

  const commitPattern = /^(\w+)(?:\(([\w\s]+)\))?: (.+)$/;
  const commitsByTypes = commits.reduce((acc, commit) => {
    const match = commit.title.match(commitPattern);
    if (!match) {
      return acc;
    }
    const [, type, scope, message] = commit.title.match(commitPattern);

    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push({
      scope,
      message,
      description: commit.description,
    });
    return acc;
  }, {});

  const features = commitsByTypes['feat']?.map(formatCommit).join('\n');
  const fixes = commitsByTypes['fix']?.map(formatCommit).join('\n');
  const changeLog = [
    `## ${nextVersion}`,
    features ? ['### Features', features] : [],
    fixes ? ['### Fixes', fixes] : [],
  ]
    .flat(Infinity)
    .join('\n\n');

  console.log('Updating worskpace version...');
  execSync(`node scripts/setWorkspaceVersions.js ${nextVersion}`);
  execSync(
    `yarn react-native-version -A -r --generate-build --skip-tag packages/app`,
  );

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
