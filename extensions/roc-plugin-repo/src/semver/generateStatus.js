import conventionalChangelog from 'conventional-changelog';
import semver from 'semver';
import { upperCase } from 'lodash';

import {
  isBreakingChange,
  versions,
  incrementToString,
  getMultiScopes,
  getAutoScopes,
} from './utils';

export default function generateStatus(projects, isMonorepo, from, prerelease) {
  return new Promise(resolve => {
    const status = {};

    projects.forEach(project => {
      status[project.name] = {
        increment: versions.NOTHING,
        commits: [],
        path: project.path,
        newVersion: undefined,
        packageJSON: project.packageJSON,
        currentVersion: project.packageJSON.version,
        currentVersionPrerelease: undefined,
        currentPrerelease: undefined,
      };
    });

    conventionalChangelog(
      {
        preset: 'angular',
        append: true,
        transform(commit, cb) {
          const multiScopes = getMultiScopes(commit, isMonorepo);
          const autoScopes = getAutoScopes(commit, isMonorepo, projects);
          // We are only interested in commits which scope is one of our projects
          if (
            isMonorepo &&
            upperCase(commit.scope) !== 'ALL' &&
            multiScopes.length === 0 &&
            autoScopes.length === 0 &&
            !projects.find(({ name }) => name === commit.scope)
          ) {
            cb();
            return;
          }

          // The projects that are effected by the scope
          // Will always be the first project in a non monorepo
          let affectedProjects = [projects[0].name];

          if (isMonorepo) {
            if (upperCase(commit.scope) === 'ALL') {
              affectedProjects = Object.keys(status);
            } else if (multiScopes.length > 0) {
              affectedProjects = multiScopes;
            } else if (autoScopes.length > 0) {
              affectedProjects = autoScopes;
            } else {
              affectedProjects = [commit.scope];
            }
          }

          let toPush = null;
          if (commit.type === 'fix' || commit.type === 'perf') {
            affectedProjects.forEach(p => {
              status[p].increment = Math.max(
                status[p].increment,
                versions.PATCH,
              );
            });
            toPush = commit;
          }
          if (commit.type === 'feat' || commit.type === 'revert') {
            affectedProjects.forEach(p => {
              status[p].increment = Math.max(
                status[p].increment,
                versions.MINOR,
              );
            });
            toPush = commit;
          }
          if (isBreakingChange(commit)) {
            affectedProjects.forEach(p => {
              status[p].increment = Math.max(
                status[p].increment,
                versions.MAJOR,
              );
            });
            toPush = commit;
          }
          if (toPush) {
            affectedProjects.forEach(p => {
              status[p].commits.push(commit);
            });
          }
          if (commit.type === 'release') {
            status[affectedProjects[0]].increment = versions.NOTHING;
            status[affectedProjects[0]].currentVersion = commit.subject;
            status[affectedProjects[0]].commits = [];

            // If we hit a release we also want to reset the prerelease
            status[affectedProjects[0]].currentVersionPrerelease = undefined;
            status[affectedProjects[0]].currentPrerelease = undefined;
          }
          if (commit.type === 'prerelease') {
            status[affectedProjects[0]].currentVersionPrerelease =
              commit.subject;
            status[affectedProjects[0]].currentPrerelease = semver.prerelease(
              commit.subject,
            )[0];

            if (prerelease) {
              status[affectedProjects[0]].commits = [];
            }
          }
          cb();
        },
      },
      {},
      { reverse: true, from },
      {
        noteKeywords: [
          'SCOPE',
          'SCOPES',
          'BREAKING CHANGE',
          'BREAKING CHANGES',
        ],
      },
    )
      .on('end', () => {
        Object.keys(status).forEach(project => {
          if (status[project].commits.length === 0) {
            delete status[project];
          } else if (prerelease && status[project].currentVersionPrerelease) {
            // If we have a previous prerelease we want to find out if we have made a larger change
            const difference = semver.diff(
              status[project].currentVersion,
              semver.inc(status[project].currentVersionPrerelease, 'patch'),
            );
            // If the range has changed we will need to make a new prerelease
            if (incrementToString(status[project].increment) !== difference) {
              status[project].newVersion = semver.inc(
                status[project].currentVersion,
                `pre${incrementToString(status[project].increment)}`,
                prerelease,
              );
            } else {
              status[project].newVersion = semver.inc(
                status[project].currentVersionPrerelease,
                'prerelease',
                prerelease,
              );
            }
          } else {
            status[project].newVersion = semver.inc(
              status[project].currentVersion,
              prerelease
                ? `pre${incrementToString(status[project].increment)}`
                : incrementToString(status[project].increment),
              prerelease,
            );
          }
        });
        resolve(status);
      })
      .resume();
  });
}
