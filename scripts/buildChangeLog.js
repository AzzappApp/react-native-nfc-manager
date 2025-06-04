const path = require('path');
const gitStream = require('git-spawned-stream');
const semVer = require('semver');
const taggedVersions = require('tagged-versions');
const internal = require('../internal-version.json');
const pkg = require('../package.json');

const loadCommits = rev => {
  const repoPath = path.join(process.cwd(), '.git');
  const inner = Date.now();
  const outer = inner - 1;

  // How the output should look like
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

/**
 * Find the most recent commit hash where the commit message starts with the given prefix.
 *
 * @param {string} prefix The commit message prefix (e.g., "chore(ci):")
 * @returns {Promise<string|null>} A promise that resolves with the commit hash or null if not found.
 */
const findCommitByPrefix = prefix => {
  const repoPath = path.join(process.cwd(), '.git');
  return new Promise((resolve, reject) => {
    let dataStr = '';
    const stream = gitStream(repoPath, [
      'log',
      '--grep',
      `^${prefix}`,
      '-n',
      '1',
      '--format=%H',
    ]);
    stream.on('data', data => {
      dataStr += data.toString('utf8');
    });
    stream.on('error', err => {
      reject(err);
    });
    stream.on('end', () => {
      const commitHash = dataStr.trim();
      resolve(commitHash || null);
    });
  });
};

module.exports = async function buildChangeLog(
  nextVersion,
  prerelease,
  group = true,
  commitPrefix = null, // optionally override the commit range
) {
  if (
    !nextVersion ||
    typeof nextVersion !== 'string' ||
    typeof prerelease !== 'boolean'
  ) {
    console.error(
      'Please provide a valid next version string and a boolean for prerelease.',
    );
    process.exit(1);
  }
  const currentVersion = `${pkg.version}-${internal.kind}.${internal.version}`;
  console.log('Checking previous versions...');
  const tags = (await taggedVersions.getList())
    .filter(
      tag =>
        (prerelease || !semVer.prerelease(tag.version)) &&
        semVer.lt(tag.version, currentVersion),
    )
    .sort((a, b) => semVer.rcompare(a.version, b.version));

  const lastTag = tags?.shift();

  let rev = null;

  // If a commitPrefix is provided, try to use the last commit whose message starts with that prefix.
  if (commitPrefix) {
    console.log(
      `Searching for last commit with message starting with "${commitPrefix}"...`,
    );
    const commitHash = await findCommitByPrefix(commitPrefix);
    if (commitHash) {
      rev = `${commitHash}..HEAD`;
      console.log(
        `Using commit ${commitHash} (message starts with "${commitPrefix}") as the changelog start point.`,
      );
    } else {
      console.log(
        `No commit found with message starting with "${commitPrefix}".`,
      );
    }
  }

  // Fallback: if no commit range was defined via commitPrefix, use the last tag.
  if (!rev) {
    rev = lastTag ? `${lastTag.hash}..HEAD` : null;
    if (lastTag) {
      console.log(`Using tag ${lastTag.version} as the changelog start point.`);
    }
  }

  console.log('Retrieving commits...');
  const commits = await loadCommits(rev);

  const commitPattern = /^(\w+)(?:\(([\w\s]+)\))?: (.+)$/;
  let changeLog = '';
  if (group) {
    const commitsByTypes = commits.reduce((acc, commit) => {
      const match = commit.title.match(commitPattern);
      if (!match) {
        return acc;
      }
      const [, type, scope, message] = match;

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
          const [, type, scope, message] = match;
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

  return changeLog;
};
