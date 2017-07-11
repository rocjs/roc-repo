import path from 'path';
import conventionalChangelog from 'conventional-changelog';

export const versions = {
  NOTHING: 0,
  PATCH: 1,
  MINOR: 2,
  MAJOR: 3,
};

export function isBreakingChange(commit) {
  return (
    typeof commit.footer === 'string' &&
    commit.footer.includes('BREAKING CHANGE')
  );
}

export function incrementToString(increment) {
  if (increment === versions.PATCH) {
    return 'patch';
  } else if (increment === versions.MINOR) {
    return 'minor';
  } else if (increment === versions.MAJOR) {
    return 'major';
  }

  return '';
}

export function getLatestCommitsSinceRelease(preset) {
  return new Promise(resolve => {
    const latest = {};
    conventionalChangelog(
      {
        preset,
        append: true,
        transform(commit, cb) {
          if (commit.type === 'release') {
            latest[commit.scope] = commit.hash;
          }
          cb();
        },
      },
      {},
      { reverse: true },
    )
      .on('end', () => resolve(latest))
      .resume();
  });
}

export function conventionalChangelogOptions(preset, isMonorepo) {
  return project => ({
    preset,
    append: true,
    pkg: {
      path: path.join(project.path, 'package.json'),
    },
    transform(commit, cb) {
      if (isMonorepo && commit.scope === project.name) {
        // Remove the scope if we are using monorepos since it will
        // be the same for the entire changelog
        commit.scope = null; // eslint-disable-line no-param-reassign
        return cb(null, commit);
      } else if (!isMonorepo) {
        return cb(null, commit);
      }

      return cb();
    },
  });
}
