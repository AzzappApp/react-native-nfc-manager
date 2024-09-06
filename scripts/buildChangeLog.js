const path = require('path');
const gitStream = require('git-spawned-stream');
const semVer = require('semver');
const taggedVersions = require('tagged-versions');
const pkg = require('../package.json');

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

const formatCommitMessage = message =>
  message.replace(
    /#(\d+)/g,
    '[#$1](https://github.com/AzzappApp/azzapp/pull/$1)',
  );

const formatGroupedCommit = ({ scope, message }) => {
  return `* ${scope ? `**${scope}:** ` : ''}${formatCommitMessage(message)}`;
};

const formatCommit = ({ scope, message, type }) => {
  return `* ${type ? `**${type}:** ` : ''} - ${
    scope ? `**${scope}:** ` : ''
  }${formatCommitMessage(message)}`;
};

const BREAKING_CHANGE_PATTERN = /BREAKING CHANGE/g;

module.exports = async function buildChangeLog(
  prerelease = false,
  majorInc = false,
  group = true,
  nextVersion = null,
) {
  const currentVersion = pkg.version;
  console.log('Checking previous versions...');
  const tags = (await taggedVersions.getList())
    .filter(
      tag =>
        (prerelease || !semVer.prerelease(tag.version)) &&
        semVer.lt(tag.version, currentVersion),
    )
    .sort((a, b) => semVer.rcompare(a.version, b.version));

  const lastTag = tags?.shift();

  console.log('Retriving commits...');
  const commits = await loadCommits(lastTag ? `${lastTag.hash}..HEAD` : null);

  if (nextVersion == null) {
    console.log('Determining version and building change log...');
    const increment = majorInc
      ? 'major'
      : commits.some(
            c =>
              BREAKING_CHANGE_PATTERN.test(c.title) ||
              BREAKING_CHANGE_PATTERN.test(c.description),
          )
        ? 'minor'
        : 'patch';

    const lastReleasedVersion = lastTag ? lastTag.version : currentVersion;
    let [major, minor, patch] = extractVersionNumber(lastReleasedVersion);
    const [currentMajor, currentMinor, currentPatch] =
      extractVersionNumber(currentVersion);

    if (currentMajor > major || currentMinor > minor || currentPatch > patch) {
      major = currentMajor;
      minor = currentMinor;
      patch = currentPatch;
    }

    switch (increment) {
      case 'major':
        nextVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        nextVersion = `${major}.${minor + 1}.0`;
        break;
      default:
        nextVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }
    if (prerelease) {
      nextVersion = `${nextVersion}-rc.1`;
    }
  }

  const commitPattern = /^(\w+)(?:\(([\w\s]+)\))?: (.+)$/;
  let changeLog = '';
  if (group) {
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

    const features = commitsByTypes['feat']
      ?.map(formatGroupedCommit)
      .join('\n');
    const fixes = commitsByTypes['fix']?.map(formatGroupedCommit).join('\n');
    changeLog = [
      `## ${nextVersion}`,
      features ? ['### Features', features] : [],
      fixes ? ['### Fixes', fixes] : [],
    ]
      .flat(Infinity)
      .join('\n\n');
  } else {
    changeLog = [
      `## ${nextVersion}`,
      commits
        .map(commit => {
          const match = commit.title.match(commitPattern);
          if (!match) {
            return null;
          }
          const [, type, scope, message] = commit.title.match(commitPattern);
          if (type === 'chore') {
            return null;
          }
          return formatCommit({
            type,
            scope,
            message,
          });
        })
        .filter(i => !!i)
        .join('\n'),
    ].join('\n\n');
  }

  return {
    nextVersion,
    changeLog,
  };
};

const extractVersionNumber = version => {
  const [major, minor, patch] = version.split('-')[0].split('.');
  return [Number(major), Number(minor), Number(patch)];
};
