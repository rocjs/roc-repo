import path from 'path';
import conventionalChangelog from 'conventional-changelog';
import semver from 'semver';
import { upperCase } from 'lodash';
import execa from 'execa';

import conventionalChangelogRoc from './conventional-changelog-roc';

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

export function incrementToValue(increment) {
  if (increment === 'patch') {
    return versions.PATCH;
  } else if (increment === 'minor') {
    return versions.MINOR;
  } else if (increment === 'major') {
    return versions.MAJOR;
  }

  return versions.NOTHING;
}

export function getLatestCommitsSinceRelease(from, projects, isMonorepo) {
  return new Promise(resolve => {
    const latest = projects.reduce(
      (previous, project) => ({
        ...previous,
        [project.name]: {
          release: {},
          prerelease: {},
        },
      }),
      {},
    );
    conventionalChangelog(
      {
        config: conventionalChangelogRoc(),
        append: true,
        transform(commit, cb) {
          if (commit.type === 'release') {
            const project = isMonorepo ? commit.scope : projects[0].name;

            latest[project] = {
              release: commit,
              prerelease: {},
            };
          }
          if (commit.type === 'prerelease') {
            const project = isMonorepo ? commit.scope : projects[0].name;

            latest[project] = {
              ...latest[project],
              prerelease: commit,
            };
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

export function conventionalChangelogOptions(isMonorepo, projects, options) {
  return project => ({
    config: conventionalChangelogRoc(options),
    append: true,
    pkg: {
      path: path.join(project.path, 'package.json'),
    },
    transform(commit, cb) {
      if (commit) {
        // If the type of the commit is a revert commit we
        // will get the scope from the subject instead
        if (commit.type === 'revert') {
          // Assums the Angular convention
          // eslint-disable-next-line no-unused-vars
          const [all, type, scope] = commit.subject.match(
            /^(\w*)(?:\((.*)\))?: (.*)$/,
          );
          // eslint-disable-next-line no-param-reassign
          commit.scope = scope;
        }
      }

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
      : status[project.name].newVersion;

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
  if (
    isMonorepo &&
    (commit.scope === '*' || upperCase(commit.scope) === 'AUTO')
  ) {
    // Get a sorted list of all file names affected by this commit
    let affectedFiles = execa
      .shellSync(`git diff-tree --no-commit-id --name-only -r ${commit.hash}`)
      .stdout.split('\n')
      .filter(Boolean);

    if (affectedFiles.length > 0) {
      // Create a structure for holding the project location
      // and it's scope. By sorting it by prefix, we're able
      // to do a single pass over the projects and files
      const scopeMap = projects.map(p => ({
        scope: p.name,
        prefix: path.join(p.directory, p.folder),
      }));

      const remainingFiles = affectedFiles;
      // Reduce the projects down to a list of affected scopes
      return scopeMap.reduce((affectedScopes, { scope, prefix }) => {
        // Remove all files that matches the current scope
        const updatedAffectedFiles = remainingFiles.filter(
          file => !file.startsWith(prefix),
        );

        // If we removed some files from affectedFiles we know that the current scope
        // was a match and therefore the scope was affected by the commit
        if (updatedAffectedFiles.length !== remainingFiles.length) {
          affectedScopes.push(scope);
          affectedFiles = updatedAffectedFiles;
        }

        // TODO If affectedFiles is not empty after all scopes we know that the commit
        // has modified things outside the projects and we could use this information to display
        // a warning perhaps?

        return affectedScopes;
      }, []);
    }
  }

  return [];
}
