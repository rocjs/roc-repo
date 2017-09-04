import path from 'path';
import conventionalChangelog from 'conventional-changelog';
import semver from 'semver';
import { upperCase } from 'lodash';
import { executeSync } from 'roc';

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

export function getLatestCommitsSinceRelease(preset, from, singleProjectName) {
  return new Promise(resolve => {
    const latest = {};
    conventionalChangelog(
      {
        preset,
        append: true,
        transform(commit, cb) {
          if (commit.type === 'release') {
            if (!singleProjectName) {
              latest[commit.scope] = commit.hash;
            } else {
              latest[singleProjectName] = commit.hash;
            }
          }
          cb();
        },
      },
      {},
      { from, reverse: true },
    )
      .on('end', () => resolve(latest))
      .resume();
  });
}

export function conventionalChangelogOptions(preset, isMonorepo, projects) {
  return project => ({
    preset,
    append: true,
    pkg: {
      path: path.join(project.path, 'package.json'),
    },
    transform(commit, cb) {
      if (!isMonorepo) {
        return cb(null, commit);
      } else if (
        commit.scope === project.name ||
        upperCase(commit.scope) === 'ALL' ||
        getMultiScopes(commit, isMonorepo).includes(project.name) ||
        getAutoScopes(commit, isMonorepo, projects).includes(project.name)
      ) {
        // Remove the scope if we are using monorepos since it will
        // be the same for the entire changelog
        commit.scope = null; // eslint-disable-line no-param-reassign
        // eslint-disable-next-line no-param-reassign
        commit.notes = commit.notes.filter(
          note =>
            upperCase(note.title) !== 'SCOPES' &&
            upperCase(note.title) !== 'SCOPE',
        );
        return cb(null, commit);
      }

      return cb();
    },
  });
}

export function getNextVersions(status, projects) {
  const getNextVersion = project =>
    !status[project.name]
      ? project.packageJSON.version
      : semver.inc(
          project.packageJSON.version,
          incrementToString(status[project.name].increment),
        );

  return projects.reduce(
    (dependencies, project) => ({
      ...dependencies,
      [project.name]: {
        ...project,
        version: getNextVersion(project),
      },
    }),
    {},
  );
}

export function createVersionsDoesNotMatch(
  projectsWithVersions,
  dependencies,
  ignoreSemVer,
) {
  return dependency => {
    // If the dependency is a local dependency we should remove it, return false
    if (Object.keys(projectsWithVersions).includes(dependency)) {
      if (ignoreSemVer) {
        return false;
      }

      // We check if the version match the requested one, accepting any version for "latest"
      return (
        dependencies[dependency] !== 'latest' &&
        !semver.satisfies(
          projectsWithVersions[dependency].version,
          dependencies[dependency],
        )
      );
    }

    return true;
  };
}

export function getDefaultPrerelease(prerelease) {
  if (prerelease === true) {
    return 'alpha';
  } else if (prerelease === false) {
    return undefined;
  }

  return prerelease;
}

export function getMultiScopes(commit, isMonorepo) {
  if (isMonorepo && upperCase(commit.scope) === 'MULTI') {
    return (commit.notes.find(
      ({ title }) =>
        upperCase(title) === 'SCOPE' || upperCase(title) === 'SCOPES',
    ) || { text: '' }).text
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length !== 0);
  }

  return [];
}

export function getAutoScopes(commit, isMonorepo, projects) {
  if (isMonorepo && commit.scope === '*') {
    return projects
      .map(project => {
        const result = executeSync(
          `git show -s ${commit.hash} ${project.path}`,
          { silent: true },
        );
        if (result.length > 0) {
          return project.name;
        }
        return undefined;
      })
      .filter(r => Boolean(r));
  }

  return [];
}
